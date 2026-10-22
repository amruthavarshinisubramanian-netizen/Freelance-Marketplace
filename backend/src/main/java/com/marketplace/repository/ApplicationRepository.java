package com.marketplace.repository;

import com.marketplace.entity.Application;
import com.marketplace.entity.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    @Query("SELECT a FROM Application a JOIN FETCH a.project p JOIN FETCH a.freelancer f JOIN FETCH p.client c WHERE f.userId = :freelancerId ORDER BY a.appliedAt DESC")
    List<Application> findByFreelancerIdWithDetails(@Param("freelancerId") Long freelancerId);

    @Query("SELECT a FROM Application a JOIN FETCH a.project p JOIN FETCH a.freelancer f JOIN FETCH p.client c WHERE c.userId = :clientId ORDER BY a.appliedAt DESC")
    List<Application> findByClientIdWithDetails(@Param("clientId") Long clientId);

    @Query("SELECT a FROM Application a JOIN FETCH a.project p JOIN FETCH a.freelancer f WHERE p.projectId = :projectId ORDER BY a.appliedAt DESC")
    List<Application> findByProjectIdWithDetails(@Param("projectId") Long projectId);

    Optional<Application> findByProjectProjectIdAndFreelancerUserId(Long projectId, Long freelancerId);

    boolean existsByProjectProjectIdAndFreelancerUserId(Long projectId, Long freelancerId);

    long countByStatus(ApplicationStatus status);

    long countByProjectProjectId(Long projectId);

    long countByProjectProjectIdAndStatus(Long projectId, ApplicationStatus status);

    @Query("SELECT a FROM Application a JOIN FETCH a.project p JOIN FETCH a.freelancer f JOIN FETCH p.client c ORDER BY a.appliedAt DESC")
    List<Application> findAllWithDetails();
}

