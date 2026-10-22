package com.marketplace.repository;

import com.marketplace.entity.Project;
import com.marketplace.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByClientUserIdOrderByCreatedAtDesc(Long clientId);

    long countByStatus(ProjectStatus status);

    @Query("SELECT SUM(p.budget) FROM Project p")
    BigDecimal sumTotalBudget();

    List<Project> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Project p JOIN FETCH p.client c WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:category IS NULL OR LOWER(p.category) = LOWER(:category)) AND " +
           "(:minBudget IS NULL OR p.budget >= :minBudget) AND " +
           "(:maxBudget IS NULL OR p.budget <= :maxBudget) AND " +
           "(:search IS NULL OR (" +
           "   LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "   LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "   LOWER(p.requiredSkills) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "   LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%'))" +
           ")) " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'budget_asc' THEN p.budget END ASC, " +
           "CASE WHEN :sortBy = 'budget_desc' THEN p.budget END DESC, " +
           "CASE WHEN :sortBy = 'deadline' THEN p.deadline END ASC, " +
           "p.createdAt DESC")
    List<Project> filterProjects(@Param("status") ProjectStatus status,
                                 @Param("category") String category,
                                 @Param("minBudget") BigDecimal minBudget,
                                 @Param("maxBudget") BigDecimal maxBudget,
                                 @Param("search") String search,
                                 @Param("sortBy") String sortBy);
}

