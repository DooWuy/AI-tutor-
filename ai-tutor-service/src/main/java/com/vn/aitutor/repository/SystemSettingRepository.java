package com.vn.aitutor.repository;

import com.vn.aitutor.entity.SystemSetting;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {

    List<SystemSetting> findByGroupName(String groupName);

    List<SystemSetting> findAllByOrderByGroupNameAscKeyAsc();
}
