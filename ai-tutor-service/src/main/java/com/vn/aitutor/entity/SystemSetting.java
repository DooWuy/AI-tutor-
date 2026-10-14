package com.vn.aitutor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    @Column(name = "key", nullable = false, length = 100)
    private String key;

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "group_name", nullable = false, length = 50)
    private String groupName;

    @Column(name = "description", length = 255)
    private String description;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
