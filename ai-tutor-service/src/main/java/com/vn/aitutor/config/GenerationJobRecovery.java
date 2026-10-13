package com.vn.aitutor.config;

import com.vn.aitutor.service.GenerationJobStore;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GenerationJobRecovery implements ApplicationRunner {

    private final GenerationJobStore store;

    @Override
    public void run(ApplicationArguments args) {
        store.failInterrupted();
    }
}
