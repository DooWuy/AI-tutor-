package com.vn.aitutor.dto.request.user;

import jakarta.validation.constraints.NotNull;

/** Explicit target state makes retries safe. */
public record AccountStatusRequest(@NotNull Boolean active) {}
