package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Book;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, UUID> {

    List<Book> findAllByOrderByTitleAsc();

    List<Book> findBySubjectOrderByTitleAsc(String subject);

    List<Book> findByGradeLevelOrderByTitleAsc(String gradeLevel);

    List<Book> findBySubjectAndGradeLevelOrderByTitleAsc(String subject, String gradeLevel);
}
