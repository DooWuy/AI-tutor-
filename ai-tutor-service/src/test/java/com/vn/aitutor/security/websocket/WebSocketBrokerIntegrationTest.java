package com.vn.aitutor.security.websocket;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.config.WebSocketConfig;
import com.vn.aitutor.controller.ChatWebSocketController;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.exception.WebSocketExceptionHandler;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.security.jwt.JwtProvider;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.chat.IChatService;
import java.lang.reflect.Type;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import org.apache.catalina.startup.Tomcat;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.annotation.*;
import org.springframework.core.env.MapPropertySource;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/** Real WebSocket -> JWT interceptor -> authorization -> RabbitMQ STOMP -> personal queue. */
@EnabledIfEnvironmentVariable(named = "WEBSOCKET_INTEGRATION", matches = "true")
@Testcontainers(disabledWithoutDocker = true)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class WebSocketBrokerIntegrationTest {
    @Container static final GenericContainer<?> RABBIT = new GenericContainer<>(DockerImageName.parse("rabbitmq:3.13-management-alpine"))
            .withEnv("RABBITMQ_DEFAULT_USER", "notification-test")
            .withEnv("RABBITMQ_DEFAULT_PASS", "integration-only")
            .withCommand("sh", "-c", "rabbitmq-plugins enable --offline rabbitmq_stomp && rabbitmq-server")
            .withExposedPorts(61613);
    @TempDir static Path directory;
    static final UUID ONE = UUID.randomUUID(), TWO = UUID.randomUUID(), CHAT = UUID.randomUUID();
    Tomcat tomcat;
    AnnotationConfigWebApplicationContext web;
    WebSocketStompClient client;
    GenericContainer<?> nginx;
    org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler clientScheduler;
    String url;
    List<StompSession> sessions = new ArrayList<>();

    @BeforeAll void start() throws Exception {
        web = new AnnotationConfigWebApplicationContext();
        web.getEnvironment().getPropertySources().addFirst(new MapPropertySource("broker-test", Map.of(
                "RABBITMQ_HOST", RABBIT.getHost(), "RABBITMQ_STOMP_PORT", RABBIT.getMappedPort(61613),
                "RABBITMQ_USERNAME", "notification-test", "RABBITMQ_PASSWORD", "integration-only",
                "app.jwt.expiration", "3600000", "app.jwt.secret", "integration-only-signing-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ-abcdef")));
        web.getEnvironment().setActiveProfiles("prod");
        web.register(Config.class);
        tomcat = new Tomcat(); tomcat.setBaseDir(directory.toString()); tomcat.setPort(0); tomcat.getConnector();
        var context = tomcat.addContext("", directory.toString());
        context.addServletContainerInitializer(new org.apache.tomcat.websocket.server.WsSci(), null);
        var servlet = Tomcat.addServlet(context, "dispatcher", new DispatcherServlet(web));
        servlet.setLoadOnStartup(1); servlet.addMapping("/");
        tomcat.start();
        int backendPort = tomcat.getConnector().getLocalPort();
        org.testcontainers.Testcontainers.exposeHostPorts(backendPort);
        String proxyConfig = java.nio.file.Files.readString(Path.of("../ai-tutor-frontend/nginx.conf"))
                .replace("http://ai-tutor-service:8088", "http://host.testcontainers.internal:" + backendPort);
        nginx = new GenericContainer<>(DockerImageName.parse("nginx:alpine"))
                .withCopyToContainer(org.testcontainers.images.builder.Transferable.of(proxyConfig), "/etc/nginx/conf.d/default.conf")
                .withExposedPorts(80);
        nginx.start();
        url = "ws://" + nginx.getHost() + ":" + nginx.getMappedPort(80) + "/ws";
        client = new WebSocketStompClient(new StandardWebSocketClient());
        clientScheduler = new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler();
        clientScheduler.initialize();
        client.setTaskScheduler(clientScheduler);
        client.setMessageConverter(new org.springframework.messaging.converter.CompositeMessageConverter(List.of(
                new StringMessageConverter() {
                    @Override protected boolean supportsMimeType(org.springframework.messaging.MessageHeaders headers) { return true; }
                }, new org.springframework.messaging.converter.ByteArrayMessageConverter() {
                    // Raw STOMP client sends JSON bytes while preserving application/json for the server.
                    @Override protected boolean supportsMimeType(org.springframework.messaging.MessageHeaders headers) { return true; }
                })));
        client.setReceiptTimeLimit(10000);
        var relay = web.getBean(org.springframework.messaging.simp.stomp.StompBrokerRelayMessageHandler.class);
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(20);
        while (!relay.isBrokerAvailable() && System.nanoTime() < deadline) Thread.sleep(50);
        assertTrue(relay.isBrokerAvailable(), "STOMP relay connected to RabbitMQ");
    }
    @AfterEach void disconnect() {
        sessions.forEach(s -> {
            // A rejected subscription closes the transport concurrently with cleanup.
            try { if (s.isConnected()) s.disconnect(); }
            catch (org.springframework.messaging.MessageDeliveryException ignored) { }
        });
        sessions.clear();
    }
    @AfterAll void stop() throws Exception {
        if (client != null) client.stop();
        if (clientScheduler != null) clientScheduler.shutdown();
        if (nginx != null) nginx.stop();
        if (tomcat != null) { tomcat.stop(); tomcat.destroy(); }
        if (web != null) web.close();
    }
    StompSession connect(String token, StompSessionHandler handler) throws Exception {
        if (token.equals("one-token") || token.equals("two-token")) {
            var user = new User(); user.setUsername(token.equals("one-token") ? "one" : "two");
            user.setRole(com.vn.aitutor.entity.enums.Role.STUDENT);
            token = web.getBean(JwtProvider.class).generateAccessToken(user);
        }
        var headers = new StompHeaders(); headers.add("Authorization", "Bearer " + token);
        StompSession session = client.connectAsync(url, new org.springframework.web.socket.WebSocketHttpHeaders(), headers, handler).get(20, TimeUnit.SECONDS);
        sessions.add(session);
        return session;
    }
    void subscribe(StompSession session, String destination, StompFrameHandler handler) throws Exception {
        session.setAutoReceipt(true);
        var latch = new CountDownLatch(1);
        session.subscribe(destination, handler).addReceiptTask(latch::countDown);
        assertTrue(latch.await(10, TimeUnit.SECONDS), "Subscription receipt");
    }
    StompFrameHandler strings(java.util.function.Consumer<String> callback) {
        return new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders headers) { return String.class; }
            @Override public void handleFrame(StompHeaders headers, Object payload) { callback.accept((String) payload); }
        };
    }

    @Test void principalSurvivesConnectAndPersonalQueuesDoNotLeakAcrossAccounts() throws Exception {
        StompSession one = connect("one-token", new StompSessionHandlerAdapter() {});
        StompSession two = connect("two-token", new StompSessionHandlerAdapter() {});
        var first = new LinkedBlockingQueue<String>(); var second = new LinkedBlockingQueue<String>();
        subscribe(one, "/user/queue/notifications", strings(first::add));
        subscribe(two, "/user/queue/notifications", strings(second::add));
        web.getBean(SimpMessagingTemplate.class).convertAndSendToUser("one", "/queue/notifications", "personal-one");
        web.getBean(SimpMessagingTemplate.class).convertAndSendToUser("two", "/queue/notifications", "personal-two");
        assertEquals("personal-one", first.poll(10, TimeUnit.SECONDS));
        assertEquals("personal-two", second.poll(10, TimeUnit.SECONDS));
        assertNull(first.poll(200, TimeUnit.MILLISECONDS));
        assertNull(second.poll(200, TimeUnit.MILLISECONDS));
    }

    @Test void rawBrokerAndForeignUserOrChatSubscriptionsAreRejected() throws Exception {
        for (String destination : List.of("/queue/notifications", "/topic/notifications", "/user/two/queue/notifications",
                "/user/queue/chat-sessions/" + UUID.randomUUID() + "/stream")) {
            var rejected = new CountDownLatch(1);
            StompSession session = connect("one-token", new StompSessionHandlerAdapter() {
                @Override public void handleFrame(StompHeaders headers, Object payload) { rejected.countDown(); }
                @Override public void handleTransportError(StompSession session, Throwable exception) { rejected.countDown(); }
            });
            session.subscribe(destination, strings(value -> fail("Unauthorized delivery")));
            assertTrue(rejected.await(10, TimeUnit.SECONDS), destination);
        }
    }

    @Test void ownedChatSubscriptionAndSendStillReachTheController() throws Exception {
        StompSession one = connect("one-token", new StompSessionHandlerAdapter() {});
        var answer = new LinkedBlockingQueue<String>();
        subscribe(one, "/user/queue/chat-sessions/" + CHAT + "/stream", strings(answer::add));
        var headers = new StompHeaders(); headers.setDestination("/app/chat-sessions/" + CHAT + "/messages");
        headers.setContentType(org.springframework.util.MimeTypeUtils.APPLICATION_JSON);
        one.send(headers, "{\"message\":\"Xin chào\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertEquals("chat-done", answer.poll(10, TimeUnit.SECONDS));
        verify(web.getBean(IChatService.class)).streamChatOverWebSocket(ONE, CHAT, "one", "Xin chào");
    }

    @Test void invalidJwtAndRefreshTokenCannotConnect() {
        assertThrows(Exception.class, () -> connect("invalid-jwt", new StompSessionHandlerAdapter() {}));
        var user = new User(); user.setUsername("one"); user.setRole(com.vn.aitutor.entity.enums.Role.STUDENT);
        String refresh = web.getBean(JwtProvider.class).generateRefreshToken(user);
        assertThrows(Exception.class, () -> connect(refresh, new StompSessionHandlerAdapter() {}));
    }

    @Test void clientsCannotPublishNotificationsOrSendToAnotherUsersChat() throws Exception {
        for (String destination : List.of("/queue/notifications", "/user/queue/notifications",
                "/app/chat-sessions/" + UUID.randomUUID() + "/messages")) {
            var rejected = new CountDownLatch(1);
            StompSession session = connect("one-token", new StompSessionHandlerAdapter() {
                @Override public void handleFrame(StompHeaders headers, Object payload) { rejected.countDown(); }
                @Override public void handleTransportError(StompSession session, Throwable exception) { rejected.countDown(); }
            });
            session.send(destination, "attempted injection");
            assertTrue(rejected.await(10, TimeUnit.SECONDS), destination);
        }
    }

    @Test void reconnectWithFreshJwtRestoresPersonalSubscription() throws Exception {
        StompSession previous = connect("one-token", new StompSessionHandlerAdapter() {});
        subscribe(previous, "/user/queue/notifications", strings(value -> {}));
        previous.disconnect();
        StompSession reconnected = connect("one-token", new StompSessionHandlerAdapter() {});
        var received = new LinkedBlockingQueue<String>();
        subscribe(reconnected, "/user/queue/notifications", strings(received::add));
        web.getBean(SimpMessagingTemplate.class).convertAndSendToUser("one", "/queue/notifications", "after-reconnect");
        assertEquals("after-reconnect", received.poll(10, TimeUnit.SECONDS));
    }

    @Test void deliverySenderTransmitsTheFullQuizContractOverThePersonalQueue() throws Exception {
        var session = connect("one-token", new StompSessionHandlerAdapter() {});
        var received = new LinkedBlockingQueue<String>();
        subscribe(session, "/user/queue/notifications", strings(received::add));
        var now = java.time.Instant.now();
        var id = UUID.randomUUID();
        var dto = new com.vn.aitutor.dto.response.notification.NotificationResponse(id, "QUIZ_GENERATED",
                "Đã tạo xong bài trắc nghiệm", "Bài trắc nghiệm của bạn đã được tạo xong.",
                "/student/practice/MATH", false, now, Map.of("quizId", UUID.randomUUID().toString()));
        var claim = new com.vn.aitutor.service.system.notification.DeliveryClaim(UUID.randomUUID(), id,
                com.vn.aitutor.entity.enums.NotificationChannel.WEBSOCKET, UUID.randomUUID(), 1, now.plusSeconds(120));
        var sender = new com.vn.aitutor.service.system.notification.NotificationDeliverySender(
                web.getBean(SimpMessagingTemplate.class), mock(org.springframework.mail.javamail.JavaMailSender.class),
                "", java.time.Clock.systemUTC());
        sender.send(new com.vn.aitutor.service.system.notification.PreparedDelivery(claim, dto, "one", "", "", null));
        String payload = received.poll(10, TimeUnit.SECONDS);
        assertNotNull(payload);
        var json = tools.jackson.databind.json.JsonMapper.builder().build().readTree(payload);
        assertEquals(id.toString(), json.get("id").asText());
        assertEquals("QUIZ_GENERATED", json.get("type").asText());
        assertFalse(json.get("isRead").asBoolean());
        assertNotNull(json.get("metadata").get("quizId"));
        assertFalse(json.has("user")); assertFalse(json.has("eventKey"));
    }

    @Configuration
    @EnableWebMvc
    @Import({WebSocketConfig.class, WebSocketSecurityConfig.class, WebSocketChannelInterceptor.class,
            OwnedChatDestinationAuthorization.class, WebSocketExceptionHandler.class, ChatWebSocketController.class})
    static class Config {
        @Bean JwtProvider jwtProvider() {
            return new JwtProvider(mock(com.vn.aitutor.security.jwt.TokenBlacklistService.class));
        }
        @Bean UserDetailsService users() {
            return name -> {
                var user = new User(); user.setId(name.equals("one") ? ONE : TWO); user.setUsername(name);
                return UserPrincipal.builder().users(user).authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))).build();
            };
        }
        @Bean ChatSessionRepository sessions() {
            var repository = mock(ChatSessionRepository.class);
            when(repository.existsByIdAndStudent_User_Id(CHAT, ONE)).thenReturn(true);
            return repository;
        }
        @Bean IChatService chat(SimpMessagingTemplate messaging) {
            var chat = mock(IChatService.class);
            doAnswer(call -> { messaging.convertAndSendToUser("one", "/queue/chat-sessions/" + CHAT + "/stream", "chat-done"); return null; })
                    .when(chat).streamChatOverWebSocket(eq(ONE), eq(CHAT), eq("one"), anyString());
            return chat;
        }
    }
}
