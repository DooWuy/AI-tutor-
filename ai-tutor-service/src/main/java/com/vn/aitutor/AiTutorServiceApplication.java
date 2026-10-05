package com.vn.aitutor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.resilience.annotation.EnableResilientMethods;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableResilientMethods(proxyTargetClass = true)
public class AiTutorServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiTutorServiceApplication.class, args);
    }

}
