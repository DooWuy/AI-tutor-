package com.vn.aitutor.repository;

import com.vn.aitutor.entity.ClassAlertSetting;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassAlertSettingRepository extends JpaRepository<ClassAlertSetting, UUID> {}
