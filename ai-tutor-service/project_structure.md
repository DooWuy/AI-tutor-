# Cấu trúc thư mục Backend (ai-tutor-service)

Dưới đây là cấu trúc thư mục của dự án backend (`ai-tutor-service`) được xây dựng với Spring Boot:

```text
ai-tutor-service/
├── .gitattributes
├── .gitignore
├── Dockerfile
├── HELP.md
├── build.gradle
├── settings.gradle
├── gradlew
├── gradlew.bat
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/
    │   │       └── vn/
    │   │           └── aitutor/
    │   │               ├── AiTutorServiceApplication.java
    │   │               ├── config/
    │   │               │   ├── CloudinaryConfig.java
    │   │               │   └── WebSocketConfig.java
    │   │               ├── controller/
    │   │               │   ├── AuthController.java
    │   │               │   ├── ChatController.java
    │   │               │   └── UserController.java
    │   │               ├── dto/
    │   │               │   ├── request/
    │   │               │   │   ├── ChangePasswordRequest.java
    │   │               │   │   ├── LoginRequest.java
    │   │               │   │   ├── RegisterRequest.java
    │   │               │   │   ├── UpdateRoleRequest.java
    │   │               │   │   ├── UserCreateRequest.java
    │   │               │   │   └── UserUpdateRequest.java
    │   │               │   └── response/
    │   │               │       ├── ApiResponse.java
    │   │               │       ├── AuthResponse.java
    │   │               │       ├── JwtErrorResponse.java
    │   │               │       ├── PageResponseDTO.java
    │   │               │       └── UserResponse.java
    │   │               ├── entity/
    │   │               │   ├── CalendarEvent.java
    │   │               │   ├── ChatMessage.java
    │   │               │   ├── ChatSession.java
    │   │               │   ├── Document.java
    │   │               │   ├── DocumentChunk.java
    │   │               │   ├── Quiz.java
    │   │               │   ├── QuizAttempt.java
    │   │               │   ├── QuizQuestion.java
    │   │               │   ├── Student.java
    │   │               │   ├── Teacher.java
    │   │               │   └── User.java
    │   │               ├── enums/
    │   │               │   ├── CalendarEventType.java
    │   │               │   ├── ChatSessionStatus.java
    │   │               │   ├── DocumentStatus.java
    │   │               │   ├── Gender.java
    │   │               │   ├── QuizDifficulty.java
    │   │               │   ├── Role.java
    │   │               │   └── SenderType.java
    │   │               ├── exception/
    │   │               │   ├── AccessDeniedException.java
    │   │               │   ├── GlobalExceptionHandler.java
    │   │               │   ├── JwtAuthenticationEntryPoint.java
    │   │               │   ├── ResourceBadRequestException.java
    │   │               │   ├── ResourceConflictException.java
    │   │               │   ├── ResourceForbiddenException.java
    │   │               │   ├── ResourceNotFoundException.java
    │   │               │   └── WebSocketExceptionHandler.java
    │   │               ├── listener/
    │   │               │   └── WebSocketEventListener.java
    │   │               ├── repository/
    │   │               │   ├── StudentRepository.java
    │   │               │   ├── TeacherRepository.java
    │   │               │   └── UserRepository.java
    │   │               ├── security/
    │   │               │   ├── UserSecurity.java
    │   │               │   ├── config/
    │   │               │   │   └── SecurityConfig.java
    │   │               │   ├── filter/
    │   │               │   │   └── RateLimitingFilter.java
    │   │               │   ├── jwt/
    │   │               │   │   ├── JwtAuthenticationFilter.java
    │   │               │   │   ├── JwtProvider.java
    │   │               │   │   ├── RefreshTokenService.java
    │   │               │   │   └── TokenBlacklistService.java
    │   │               │   ├── principal/
    │   │               │   │   ├── UserDetailServiceCustom.java
    │   │               │   │   └── UserPrincipal.java
    │   │               │   └── websocket/
    │   │               │       ├── WebSocketChannelInterceptor.java
    │   │               │       └── WebSocketSecurityConfig.java
    │   │               └── service/
    │   │                   ├── IAuthService.java
    │   │                   ├── ICloudinaryService.java
    │   │                   ├── IMailService.java
    │   │                   ├── IUserService.java
    │   │                   └── impl/
    │   │                       ├── AuthServiceImpl.java
    │   │                       ├── CloudinaryServiceImpl.java
    │   │                       ├── MailServiceImpl.java
    │   │                       └── UserServiceImpl.java
    │   └── resources/
    │       ├── application-dev.yml
    │       ├── application-prod.yml
    │       ├── application.yml
    │       └── db/
    │           └── migration/
    │               ├── V1__enable_pgvector.sql
    │               └── V2__create_core_tables.sql
    └── test/
        └── java/
            └── com/
                └── vn/
                    └── aitutor/
                        └── AiTutorServiceApplicationTests.java
```
