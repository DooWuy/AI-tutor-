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
    static com.vn.aitutor.repository.TeacherRepository teachers;
    static com.vn.aitutor.repository.PasswordResetTokenRepository tokens;
    static TeacherInvitationService invitations;
    static IAuthService auth;
    static com.vn.aitutor.service.system.IMailService mail;
    static org.springframework.security.crypto.password.PasswordEncoder encoder;

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
        @Bean com.vn.aitutor.repository.TeacherRepository teachers(EntityManagerFactory f) {
            return new JpaRepositoryFactory(SharedEntityManagerCreator.createSharedEntityManager(f)).getRepository(com.vn.aitutor.repository.TeacherRepository.class);
        }
        @Bean com.vn.aitutor.repository.PasswordResetTokenRepository tokens(EntityManagerFactory f) {
            return new JpaRepositoryFactory(SharedEntityManagerCreator.createSharedEntityManager(f)).getRepository(com.vn.aitutor.repository.PasswordResetTokenRepository.class);
        }
        @Bean org.springframework.security.crypto.password.PasswordEncoder encoder() { return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4); }
        @Bean com.vn.aitutor.service.system.IMailService mail() { return mock(com.vn.aitutor.service.system.IMailService.class); }
        @Bean UserServiceImpl service(UserRepository users, com.vn.aitutor.repository.TeacherRepository teachers,
                com.vn.aitutor.repository.PasswordResetTokenRepository tokens, org.springframework.security.crypto.password.PasswordEncoder encoder,
                com.vn.aitutor.service.system.IMailService mail) {
            return new UserServiceImpl(users, null, teachers, encoder, mail, null, tokens, null, mock(UserPrincipalCache.class), null);
        }
        @Bean TeacherInvitationService invitations(UserRepository users, com.vn.aitutor.repository.PasswordResetTokenRepository tokens,
                com.vn.aitutor.service.system.IMailService mail) { return new TeacherInvitationService(users, tokens, mail); }
        @Bean AuthServiceImpl auth(UserRepository users, com.vn.aitutor.repository.PasswordResetTokenRepository tokens,
                org.springframework.security.crypto.password.PasswordEncoder encoder, com.vn.aitutor.service.system.IMailService mail) {
            var provider = new org.springframework.security.authentication.dao.DaoAuthenticationProvider(identifier -> {
                var u = users.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(identifier)
                    .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Unavailable"));
                return com.vn.aitutor.security.principal.UserPrincipal.builder().users(u)
                    .authorities(List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + u.getRole()))).build();
            });
            provider.setPasswordEncoder(encoder);
            var jwt = mock(com.vn.aitutor.security.jwt.JwtProvider.class);
            org.mockito.Mockito.when(jwt.generateAccessToken(org.mockito.ArgumentMatchers.any())).thenReturn("test-access");
            org.mockito.Mockito.when(jwt.generateRefreshToken(org.mockito.ArgumentMatchers.any())).thenReturn("test-refresh");
            return new AuthServiceImpl(users, null, encoder, new org.springframework.security.authentication.ProviderManager(provider), jwt,
                mock(com.vn.aitutor.security.jwt.TokenBlacklistService.class), mock(com.vn.aitutor.security.jwt.RefreshTokenService.class), mail, tokens);
        }
    }
    @BeforeAll static void start() {
        flyway = Flyway.configure().dataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword()).load();
        // Exercise upgrade V8 -> V9 on an existing account as well as clean V1..V8.
        Flyway.configure().dataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword()).target("8").load().migrate();
        var upgrade = new JdbcTemplate(new DriverManagerDataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword()));
        upgrade.update("INSERT INTO users(id,username,email,password_hash,full_name,gender,role) VALUES (?,?,?,'unused','Existing Teacher','OTHER','TEACHER')",UUID.randomUUID(),"legacy","legacy@example.invalid");
        flyway.migrate();
        assertEquals(1,upgrade.queryForObject("SELECT count(*) FROM users WHERE username='legacy' AND invitation_status IS NULL",Integer.class));
        context = new AnnotationConfigApplicationContext();
        context.getEnvironment().getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource("test", Map.of(
            "app.auth.cookie.secure", "false", "app.auth.cookie.same-site", "Lax", "app.auth.cookie.path", "/")));
        context.register(Config.class); context.refresh();
        jdbc = new JdbcTemplate(context.getBean(DataSource.class)); service = context.getBean(IUserService.class);
        teachers = context.getBean(com.vn.aitutor.repository.TeacherRepository.class);
        tokens = context.getBean(com.vn.aitutor.repository.PasswordResetTokenRepository.class);
        invitations = context.getBean(TeacherInvitationService.class); auth = context.getBean(IAuthService.class);
        mail = context.getBean(com.vn.aitutor.service.system.IMailService.class);
        encoder = context.getBean(org.springframework.security.crypto.password.PasswordEncoder.class);
    }
    @AfterAll static void close() { if (context != null) context.close(); }
    @BeforeEach void clear() { jdbc.execute("TRUNCATE users CASCADE"); org.mockito.Mockito.reset(mail); }
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

    com.vn.aitutor.dto.request.user.UserCreateRequest teacher(String username, String email) {
        var r = new com.vn.aitutor.dto.request.user.UserCreateRequest();
        r.setUsername(username); r.setEmail(email); r.setFullName("Teacher " + username);
        r.setRole(Role.TEACHER); r.setDepartment("Science"); r.setSubjectTaught("Math"); return r;
    }
    UUID create(String name) { return service.createProfile(teacher(name, name + "@example.invalid")).getData().getUserId(); }
    String token(UUID id) { return jdbc.queryForObject("SELECT token FROM password_reset_tokens WHERE user_id=? AND NOT is_used", String.class, id); }
    void setup(String token) {
        var r = new com.vn.aitutor.dto.request.user.SetupPasswordRequest(); r.setToken(token); r.setNewPassword("PrivatePass@123"); auth.setupPassword(r);
    }
    void login(String name) {
        var r = new com.vn.aitutor.dto.request.user.LoginRequest(); r.setEmail(name); r.setPassword("PrivatePass@123");
        auth.login(r, new org.springframework.mock.web.MockHttpServletResponse());
    }
    @Test void twoTeachersHaveIndependentIdentityAndSetupDoesNotUnlock() {
        UUID a=create("Alice"), b=create("Bob");
        assertNotEquals(teachers.findByUserId(a).orElseThrow().getTeacherCode(), teachers.findByUserId(b).orElseThrow().getTeacherCode());
        assertEquals(2, jdbc.queryForObject("SELECT count(*) FROM teachers", Integer.class));
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM teacher_class_assignments", Integer.class));
        assertFalse(context.getBean(UserRepository.class).findById(a).orElseThrow().isSetupComplete());
        org.mockito.Mockito.verifyNoInteractions(mail); // no mail inside account transaction
        assertThrows(org.springframework.security.core.AuthenticationException.class, () -> login("Alice"));
        invitations.deliver(a); invitations.deliver(b);
        service.setStatus(a,false);
        setup(token(a)); setup(token(b));
        assertFalse(context.getBean(UserRepository.class).findById(a).orElseThrow().isActive());
        assertThrows(org.springframework.security.core.AuthenticationException.class, () -> login("Alice"));
        login("Bob"); service.setStatus(a,true); login("Alice");
        assertEquals("Science", service.getProfileById(a).getData().getDepartment());
        assertThrows(com.vn.aitutor.exception.ResourceConflictException.class, () -> invitations.resend(a));
        assertEquals(2, jdbc.queryForObject("SELECT count(*) FROM teachers", Integer.class));
    }
    @Test void duplicateEmailRollbackResendAndMailFailure() {
        UUID a = service.createProfile(teacher("Alice", "  Mixed@Example.invalid  ")).getData().getUserId();
        assertEquals("mixed@example.invalid", service.getProfileById(a).getData().getEmail());
        assertThrows(ResourceConflictException.class, () -> service.createProfile(teacher("Other", "MIXED@example.invalid")));
        var invalid=teacher("Invalid", "invalid@example.invalid"); invalid.setDepartment(" ");
        assertThrows(com.vn.aitutor.exception.ResourceBadRequestException.class, () -> service.createProfile(invalid));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM users", Integer.class));
        org.mockito.Mockito.doThrow(new IllegalStateException("SMTP unavailable")).when(mail).sendTeacherSetupEmail(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any());
        String old = token(a); invitations.deliver(a);
        assertEquals("FAILED", service.getProfileById(a).getData().getInvitationStatus());
        assertThrows(ResourceConflictException.class, () -> invitations.resend(a));
        jdbc.update("UPDATE users SET invitation_requested_at=now()-interval '61 seconds' WHERE id=?", a);
        invitations.resend(a); assertNotEquals(old,token(a));
        assertThrows(com.vn.aitutor.exception.ResourceBadRequestException.class, () -> setup(old));
        org.mockito.Mockito.reset(mail); invitations.deliver(a);
        assertEquals("SENT", service.getProfileById(a).getData().getInvitationStatus());
        String current=token(a); setup(current);
        assertThrows(com.vn.aitutor.exception.ResourceBadRequestException.class, () -> setup(current));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM users", Integer.class));
    }
    @Test void expiredTokenAndConcurrentCaseInsensitiveCreation() throws Exception {
        UUID a=create("Expired"); String t=token(a);
        jdbc.update("UPDATE password_reset_tokens SET expiry_date=now()-interval '1 second' WHERE user_id=?",a);
        assertThrows(com.vn.aitutor.exception.ResourceBadRequestException.class, () -> setup(t));
        var pool=Executors.newFixedThreadPool(2); var go=new CountDownLatch(1);
        try {
            var futures=new ArrayList<Future<Boolean>>();
            for (String name:List.of("First","Second")) futures.add(pool.submit(() -> {
                go.await();
                try { service.createProfile(teacher(name, name.equals("First") ? "race@example.invalid" : "RACE@example.invalid")); return true; }
                catch (ResourceConflictException | org.springframework.dao.DataIntegrityViolationException | org.hibernate.exception.ConstraintViolationException expected) { return false; }
            }));
            go.countDown(); int successes=0; for(var f:futures) if(f.get(20,TimeUnit.SECONDS)) successes++;
            assertEquals(1,successes);
            assertEquals(2,jdbc.queryForObject("SELECT count(*) FROM users",Integer.class));
            assertEquals(2,jdbc.queryForObject("SELECT count(*) FROM teachers",Integer.class));
        } finally { pool.shutdownNow(); }
    }
    @Test void teacherProfileUpdatePreservesIdentifiersAndRejectsBlankTeachingFields() {
        UUID a=create("Alice"); var before=service.getProfileById(a).getData();
        var r=new com.vn.aitutor.dto.request.user.UserUpdateRequest(); r.setFullName("Alice Updated");
        r.setDepartment("Humanities"); r.setSubjectTaught("History"); r.setSchoolName("School");
        service.updateProfile(a,r); var after=service.getProfileById(a).getData();
        assertEquals(before.getTeacherCode(),after.getTeacherCode()); assertEquals(before.getEmail(),after.getEmail());
        assertEquals("History",after.getSubjectTaught());
        r.setDepartment(" "); assertThrows(com.vn.aitutor.exception.ResourceBadRequestException.class, () -> service.updateProfile(a,r));
        assertEquals("Humanities",service.getProfileById(a).getData().getDepartment());
    }

    @Test void newTeachersCannotReadOrMutateEachOthersContentAndLockPreservesOwners() {
        UUID a=create("Alice"), b=create("Bob");
        var tx=new org.springframework.transaction.support.TransactionTemplate(context.getBean(PlatformTransactionManager.class));
        tx.executeWithoutResult(status -> {
            var em=SharedEntityManagerCreator.createSharedEntityManager(context.getBean(EntityManagerFactory.class));
            var repos=new JpaRepositoryFactory(em);
            var docs=repos.getRepository(com.vn.aitutor.repository.DocumentRepository.class);
            var quizzes=repos.getRepository(com.vn.aitutor.repository.QuizRepository.class);
            var assignments=repos.getRepository(com.vn.aitutor.repository.TeacherClassAssignmentRepository.class);
            var schoolClasses=repos.getRepository(com.vn.aitutor.repository.SchoolClassRepository.class);
            var studyClasses=repos.getRepository(com.vn.aitutor.repository.StudyClassRepository.class);
            var ua=em.find(com.vn.aitutor.entity.User.class,a); var ub=em.find(com.vn.aitutor.entity.User.class,b);
            var pa=com.vn.aitutor.security.principal.UserPrincipal.builder().users(ua).build();
            var pb=com.vn.aitutor.security.principal.UserPrincipal.builder().users(ub).build();
            var d=new com.vn.aitutor.entity.Document(); d.setTitle("Alice Document"); d.setFileName("lesson.pdf"); d.setFilePath("test/lesson.pdf"); d.setCreatedBy(ua); docs.saveAndFlush(d);
            var q=new com.vn.aitutor.entity.Quiz(); q.setTitle("Alice Quiz"); q.setCreatedBy(ua); q.setDifficulty(com.vn.aitutor.entity.enums.QuizDifficulty.MEDIUM); quizzes.saveAndFlush(q);
            var lifecycle=new com.vn.aitutor.service.curriculum.DocumentLifecycleService(docs,repos.getRepository(com.vn.aitutor.repository.DocumentChunkRepository.class),mock(com.vn.aitutor.service.system.ICloudinaryService.class));
            assertEquals(1,lifecycle.list(null,null,pa).size()); assertTrue(lifecycle.list(null,null,pb).isEmpty());
            assertThrows(com.vn.aitutor.exception.ResourceForbiddenException.class,()->lifecycle.delete(d.getId(),pb));
            var access=new com.vn.aitutor.service.quiz.QuizAccess(quizzes);
            assertEquals(q.getId(),access.require(q.getId(),pa).getId());
            assertThrows(com.vn.aitutor.exception.ResourceForbiddenException.class,()->access.require(q.getId(),pb));
            var classAccess=new com.vn.aitutor.service.analytics.AnalyticsAccess(schoolClasses,teachers,assignments,studyClasses,repos.getRepository(com.vn.aitutor.repository.StudyClassEnrollmentRepository.class));
            var classService=new com.vn.aitutor.service.classroom.TeacherClassService(classAccess,schoolClasses,teachers,assignments,null,null,quizzes,null,null);
            assertTrue(classService.list(pa).isEmpty()); assertTrue(classService.list(pb).isEmpty());
            assertTrue(studyClasses.findByTeacher_IdOrderByCreatedAtDesc(teachers.findByUserId(a).orElseThrow().getId()).isEmpty());
            var c=new com.vn.aitutor.entity.SchoolClass(); c.setName("10A");c.setGradeLevel("10");c.setAcademicYear("2026-2027");schoolClasses.saveAndFlush(c);
            assertThrows(com.vn.aitutor.exception.ResourceForbiddenException.class,()->classAccess.requireReadableClass(pb,c.getId()));
        });
        service.setStatus(a,false);service.setStatus(a,true);
        assertEquals(a,jdbc.queryForObject("SELECT created_by_id FROM documents WHERE title='Alice Document'",UUID.class));
        assertEquals(a,jdbc.queryForObject("SELECT created_by_id FROM quizzes WHERE title='Alice Quiz'",UUID.class));
    }

    @Test void dashboardCountsRealRowsAndFreshChangesWithoutDateOrOwnerFiltering() {
        var dashboard=new com.vn.aitutor.repository.AdminDashboardRepository(jdbc);
        var zero=dashboard.overview(); assertEquals(0,zero.totalUsers());assertEquals(0,zero.totalDocuments());assertEquals(0,zero.totalQuizzes());assertEquals(0,zero.chatCount());assertEquals(0,zero.attemptCount());
        UUID admin=account("Admin",Role.ADMIN), locked=account("Locked",Role.TEACHER), deleted=account("Deleted",Role.STUDENT);
        jdbc.update("UPDATE users SET is_active=false WHERE id=?",locked);jdbc.update("UPDATE users SET is_deleted=true WHERE id=?",deleted);
        UUID student=UUID.randomUUID();jdbc.update("INSERT INTO students(id,user_id,student_code,school_name,grade_level) VALUES (?,?,?,'School','10')",student,deleted,"STU-TEST");
        for(String status:List.of("SUCCESS","PROCESSING","FAILED")) jdbc.update("INSERT INTO documents(id,title,file_name,file_path,status,created_by_id) VALUES (?,?,?,'test',?,?)",UUID.randomUUID(),status,"test.pdf",status,locked);
        UUID quiz=UUID.randomUUID();jdbc.update("INSERT INTO quizzes(id,title,difficulty,created_by_id) VALUES (?,'Quiz','MEDIUM',?)",quiz,admin);
        for(String date:List.of("2026-11-01T16:59:59Z","2026-11-01T17:00:00Z")) {
            jdbc.update("INSERT INTO chat_sessions(id,student_id,created_at) VALUES (?,?,?::timestamptz)",UUID.randomUUID(),student,date);
            jdbc.update("INSERT INTO quiz_attempts(id,quiz_id,student_id,submitted_at,is_visible) VALUES (?,?,?,?::timestamptz,false)",UUID.randomUUID(),quiz,student,date);
        }
        jdbc.update("INSERT INTO quiz_attempts(id,quiz_id,student_id) VALUES (?,?,?)",UUID.randomUUID(),quiz,student);
        var counts=dashboard.overview();assertEquals(2,counts.totalUsers());assertEquals(3,counts.totalDocuments());assertEquals(1,counts.totalQuizzes());assertEquals(2,counts.chatCount());assertEquals(2,counts.attemptCount());
        assertFalse(counts.updatedAt().isBefore(zero.updatedAt()));
        jdbc.update("INSERT INTO quizzes(id,title,difficulty,created_by_id) VALUES (?,'New Quiz','MEDIUM',?)",UUID.randomUUID(),locked);
        assertEquals(2,dashboard.overview().totalQuizzes());
    }
    @Test void dashboardQueryPlanAndConcurrentSmokeOnTwentyThousandAccounts() throws Exception {
        jdbc.execute("INSERT INTO users(id,username,email,password_hash,full_name,gender,role) SELECT gen_random_uuid(),'load'||n,'load'||n||'@test.invalid','unused','Load User','OTHER','STUDENT' FROM generate_series(1,20000) n");
        jdbc.execute("ANALYZE users");
        var plan=jdbc.queryForList("EXPLAIN (ANALYZE, BUFFERS) "+com.vn.aitutor.repository.AdminDashboardRepository.COUNTS_SQL,String.class);
        var dashboard=new com.vn.aitutor.repository.AdminDashboardRepository(jdbc);
        var pool=Executors.newFixedThreadPool(20); long started=System.nanoTime();
        try {
            var tasks=new ArrayList<Callable<Long>>();
            for(int n=0;n<20;n++) tasks.add(()->{long t=System.nanoTime();assertEquals(20000,dashboard.overview().totalUsers());return (System.nanoTime()-t)/1000000;});
            long max=0;for(var result:pool.invokeAll(tasks))max=Math.max(max,result.get());
            System.out.println("Dashboard smoke: 20 concurrent reads, 20000 users, maxMs="+max+", wallMs="+(System.nanoTime()-started)/1000000);
            System.out.println(String.join("\n",plan));
        }finally{pool.shutdownNow();}
    }

    @Test void documentPaginationAndRetrievalOnlyReturnSuccessfulSurvivingDocuments() {
        UUID owner=account("Owner",Role.TEACHER), other=account("Other",Role.TEACHER);
        var tx=new org.springframework.transaction.support.TransactionTemplate(context.getBean(PlatformTransactionManager.class));
        tx.executeWithoutResult(st -> {
            var em=SharedEntityManagerCreator.createSharedEntityManager(context.getBean(EntityManagerFactory.class));
            var factory=new JpaRepositoryFactory(em);var docs=factory.getRepository(com.vn.aitutor.repository.DocumentRepository.class);
            var chunks=factory.getRepository(com.vn.aitutor.repository.DocumentChunkRepository.class);
            var service=new com.vn.aitutor.service.curriculum.DocumentLifecycleService(docs,chunks,mock(com.vn.aitutor.service.system.ICloudinaryService.class));
            String vector="["+String.join(",",Collections.nCopies(1024,"0.1"))+"]";
            UUID success=null;
            for(String status:List.of("SUCCESS","PROCESSING","FAILED")) {
                UUID id=UUID.randomUUID(); if(status.equals("SUCCESS"))success=id;
                jdbc.update("INSERT INTO documents(id,title,file_name,file_path,status,subject,grade_level,created_by_id) VALUES (?,?,'lesson.pdf','stored',?,'TOAN','10',?)",id,status,status,owner);
                jdbc.update("INSERT INTO document_chunks(id,document_id,chunk_index,content,embedding) VALUES (?,?,0,'Lesson content',?::vector)",UUID.randomUUID(),id,vector);
            }
            var principal=com.vn.aitutor.security.principal.UserPrincipal.builder().users(em.find(com.vn.aitutor.entity.User.class,owner)).build();
            assertEquals(3,service.browse(null,null,null,null,null,1,20,principal).getTotalElements());
            assertEquals(1,service.browse(null,"TOAN","10",com.vn.aitutor.entity.enums.DocumentStatus.SUCCESS,null,1,20,principal).getTotalElements());
            var otherPrincipal=com.vn.aitutor.security.principal.UserPrincipal.builder().users(em.find(com.vn.aitutor.entity.User.class,other)).build();
            assertEquals(0,service.browse(null,null,null,null,owner,1,20,otherPrincipal).getTotalElements());
            assertEquals(1,chunks.findTopSimilarChunks(vector,5).size());assertEquals(1,chunks.findTopSimilarChunksWithFilter(vector,"TOAN","10",5).size());
            var request=new com.vn.aitutor.dto.request.curriculum.DocumentMetadataRequest();request.setSubject("LY");
            service.updateMetadata(success,request,principal);
            assertEquals(0,chunks.findTopSimilarChunksWithFilter(vector,"TOAN","10",5).size());
            assertEquals(1,chunks.findTopSimilarChunksWithFilter(vector,"LY","10",5).size());
            service.delete(success,principal);em.flush();assertEquals(0,chunks.findTopSimilarChunks(vector,5).size());
        });
    }
}
