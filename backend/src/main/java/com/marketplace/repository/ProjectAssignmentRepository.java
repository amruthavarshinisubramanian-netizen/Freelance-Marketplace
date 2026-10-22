package com.marketplace.repository;

import com.marketplace.entity.ProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {

    @Query("SELECT pa FROM ProjectAssignment pa JOIN FETCH pa.freelancer f WHERE pa.project.projectId = :projectId")
    Optional<ProjectAssignment> findByProjectIdWithFreelancer(@Param("projectId") Long projectId);

    List<ProjectAssignment> findByFreelancerUserId(Long freelancerId);

    @Query("SELECT pa FROM ProjectAssignment pa JOIN FETCH pa.project p JOIN FETCH pa.freelancer f WHERE f.userId = :freelancerId")
    List<ProjectAssignment> findByFreelancerIdWithProject(@Param("freelancerId") Long freelancerId);
}

