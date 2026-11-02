package com.vn.aitutor.service.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.principal.UserPrincipalCache;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.*;
import java.util.concurrent.*;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.utility.DockerImageName;

/** Real PostgreSQL transactions: last-admin races must leave at least one active Admin. */
@Testcontainers
class AdminAccountDatabaseTest {
    @Container static final PostgreSQLContainer<?> DB = new PostgreSQLContainer<>(
            DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres"));
    static AnnotationConfigApplicationContext context;
    static JdbcTemplate jdbc;
    static IUserService service;
    static Flyway flyway;
    @Configuration @EnableTransactionManagement
    static class Config {
        @Bean DataSource dataSource() { return new DriverManagerDataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword()); }
        @Bean LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource source) {
            var factory = new LocalContainerEntityManagerFactoryBean(); factory.setDataSource(source);
            factory.setPackagesToScan("com.vn.aitutor.entity"); factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "none",
                    "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl")); return factory;
        }
        @Bean PlatformTransactionManager transactionManager(EntityManagerFactory factory) { return new JpaTransactionManager(factory); }
        @Bean UserRepository users(EntityManagerFactory factory) {
            EntityManager shared = SharedEntityManagerCreator.createSharedEntityManager(factory);
            return new JpaRepositoryFactory(shared).getRepository(UserRepository.class);
        }
        @Bean UserServiceImpl service(UserRepository users) {
            return new UserServiceImpl(users, null, null, null, null, null, null, null, mock(UserPrincipalCache.class), null);
        }
    }
    @BeforeAll static void start() {
        flyway = Flyway.configure().dataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword()).load();
        flyway.migrate();
        context = new AnnotationConfigApplicationContext(Config.class);
        jdbc = new JdbcTemplate(context.getBean(DataSource.class)); service = context.getBean(IUserService.class);
    }
    @AfterAll static void close() { if (context != null) context.close(); }
    @BeforeEach void clear() { jdbc.execute("TRUNCATE users CASCADE"); }
    UUID account(String name, Role role) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO users(id,username,email,password_hash,full_name,gender,role) VALUES (?,?,?,'unused',?,'OTHER',?)",
                id, name, name + "@example.invalid", "Display " + name, role.name()); return id;
    }
    @Test void concurrentLocksAndDeletesNeverRemoveLastAdmin() throws Exception {
        for (boolean delete : List.of(false, true)) {
            jdbc.execute("TRUNCATE users CASCADE");
            UUID a = account("one", Role.ADMIN), b = account("two", Role.ADMIN);
            var ready = new CountDownLatch(2); var go = new CountDownLatch(1);
            var pool = Executors.newFixedThreadPool(2);
            try {
                var jobs = new ArrayList<Future<Boolean>>();
                for (UUID id : List.of(a, b)) jobs.add(pool.submit(() -> {
                    ready.countDown(); assertTrue(go.await(10, TimeUnit.SECONDS));
                    try { if (delete) service.deleteProfile(id); else service.setStatus(id, false); return true; }
                    catch (ResourceConflictException expected) { return false; }
                }));
                assertTrue(ready.await(10, TimeUnit.SECONDS)); go.countDown();
                int succeeded = 0; for (var job : jobs) if (job.get(20, TimeUnit.SECONDS)) succeeded++;
                assertEquals(1, succeeded);
                assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM users WHERE role='ADMIN' AND is_active AND NOT is_deleted", Integer.class));
            } finally { pool.shutdownNow(); }
        }
    }
    @Test void searchFiltersAndRepeatedStatusUseRealDatabase() {
        account("admin", Role.ADMIN);
        UUID teacher = account("UniqueTeacher", Role.TEACHER);
        service.setStatus(teacher, false); service.setStatus(teacher, false);
        var page = service.searchAccounts(Role.TEACHER, false, "uniqueteacher", org.springframework.data.domain.PageRequest.of(0, 20));
        assertEquals(1, page.getTotalElements()); assertFalse(page.getContent().get(0).getActive());
        service.deleteProfile(teacher);
        assertEquals(0, service.searchAccounts(null, null, null, org.springframework.data.domain.PageRequest.of(0, 20)).getContent()
                .stream().filter(item -> item.getUserId().equals(teacher)).count());
        assertEquals(0, flyway.migrate().migrationsExecuted);
    }
}
