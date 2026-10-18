package com.vn.aitutor;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

@EnabledIfEnvironmentVariable(named = "INTEGRATION_TEST", matches = "true")
@SpringBootTest
class AiTutorServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
