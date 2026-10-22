package com.marketplace;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.dto.ApplicationRequest;
import com.marketplace.dto.LoginRequest;
import com.marketplace.dto.ProjectRequest;
import com.marketplace.dto.RegisterRequest;
import com.marketplace.dto.StatusUpdateRequest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FreelanceMarketplaceIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static String clientToken;
    private static String freelancerToken;
    private static Long createdProjectId;
    private static Long createdApplicationId;

    @Test
    @Order(1)
    void testAdminLoginSuccess() throws Exception {
        LoginRequest login = new LoginRequest();
        login.setEmail("admin@marketplace.com");
        login.setPassword("Admin@123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        adminToken = json.get("token").asText();
        assertNotNull(adminToken);
    }

    @Test
    @Order(2)
    void testInvalidLoginProduces401() throws Exception {
        LoginRequest login = new LoginRequest();
        login.setEmail("admin@marketplace.com");
        login.setPassword("WrongPassword@999");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    @Order(3)
    void testAdminSelfRegistrationIsRestricted() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setFullName("Fake Admin");
        reg.setEmail("fakeadmin@test.com");
        reg.setPassword("Secret@123");
        reg.setRole("ADMIN");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Admin accounts cannot be self-registered."));
    }

    @Test
    @Order(4)
    void testClientRegistrationAndLogin() throws Exception {
        String uniqueEmail = "client.workflow." + System.currentTimeMillis() + "@test.com";
        RegisterRequest reg = new RegisterRequest();
        reg.setFullName("Workflow Client");
        reg.setEmail(uniqueEmail);
        reg.setPassword("ClientPass@123");
        reg.setRole("CLIENT");

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("CLIENT"))
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        clientToken = regJson.get("token").asText();
        assertNotNull(clientToken);

        // Verify login works with these credentials
        LoginRequest login = new LoginRequest();
        login.setEmail(uniqueEmail);
        login.setPassword("ClientPass@123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("CLIENT"));
    }

    @Test
    @Order(5)
    void testFreelancerRegistrationAndLogin() throws Exception {
        String uniqueEmail = "freelancer.workflow." + System.currentTimeMillis() + "@test.com";
        RegisterRequest reg = new RegisterRequest();
        reg.setFullName("Workflow Freelancer");
        reg.setEmail(uniqueEmail);
        reg.setPassword("FreePass@123");
        reg.setRole("FREELANCER");

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("FREELANCER"))
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        freelancerToken = regJson.get("token").asText();
        assertNotNull(freelancerToken);
    }

    @Test
    @Order(6)
    void testClientCreatesProject() throws Exception {
        ProjectRequest proj = new ProjectRequest();
        proj.setTitle("Automated Spring Boot & React Verification Project");
        proj.setDescription("Full-stack integration test project verifying persistent workflows.");
        proj.setCategory("Web Development");
        proj.setBudget(new BigDecimal("3500.00"));
        proj.setDeadline(LocalDate.now().plusDays(30));
        proj.setRequiredSkills("Java, Spring Boot, React, MySQL");

        MvcResult result = mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + clientToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(proj)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.project.projectId").isNotEmpty())
                .andExpect(jsonPath("$.project.status").value("OPEN"))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        createdProjectId = json.get("project").get("projectId").asLong();
        assertTrue(createdProjectId > 0);
    }

    @Test
    @Order(7)
    void testProjectAppearsInPublicCatalogAndClientDashboard() throws Exception {
        // Public catalog
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects").isArray());

        // Client's my projects
        mockMvc.perform(get("/api/projects/client/my")
                .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    @Order(8)
    void testFreelancerAppliesToProject() throws Exception {
        ApplicationRequest app = new ApplicationRequest();
        app.setProjectId(createdProjectId);
        app.setBidAmount(new BigDecimal("3200.00"));
        app.setProposal("I am an experienced engineer with Spring Boot and React and would love to build this.");

        MvcResult result = mockMvc.perform(post("/api/applications")
                .header("Authorization", "Bearer " + freelancerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(app)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.application.status").value("PENDING"))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        createdApplicationId = json.get("application").get("applicationId").asLong();
        assertTrue(createdApplicationId > 0);
    }

    @Test
    @Order(9)
    void testPreventDuplicateApplication() throws Exception {
        ApplicationRequest duplicate = new ApplicationRequest();
        duplicate.setProjectId(createdProjectId);
        duplicate.setBidAmount(new BigDecimal("3100.00"));
        duplicate.setProposal("Duplicate bid should be rejected.");

        mockMvc.perform(post("/api/applications")
                .header("Authorization", "Bearer " + freelancerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You have already submitted a proposal for this project."));
    }

    @Test
    @Order(10)
    void testClientReviewsAndAcceptsProposal() throws Exception {
        // Client views applications for their project
        mockMvc.perform(get("/api/applications/client?projectId=" + createdProjectId)
                .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.applications[0].applicationId").value(createdApplicationId));

        // Client accepts the proposal
        StatusUpdateRequest accept = new StatusUpdateRequest();
        accept.setStatus("ACCEPTED");

        mockMvc.perform(put("/api/applications/" + createdApplicationId + "/status")
                .header("Authorization", "Bearer " + clientToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(accept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.application.status").value("ACCEPTED"));

        // Verify project is now IN_PROGRESS
        mockMvc.perform(get("/api/projects/" + createdProjectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.project.assignedFreelancerName").value("Workflow Freelancer"));
    }

    @Test
    @Order(11)
    void testFreelancerViewsAcceptedProposal() throws Exception {
        mockMvc.perform(get("/api/applications/my")
                .header("Authorization", "Bearer " + freelancerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications[0].status").value("ACCEPTED"));
    }

    @Test
    @Order(12)
    void testAdminOversightDashboardAndControls() throws Exception {
        // Dashboard stats
        mockMvc.perform(get("/api/admin/dashboard")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.users.totalUsers").value(org.hamcrest.Matchers.greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.stats.projects.totalProjects").value(org.hamcrest.Matchers.greaterThanOrEqualTo(5)));

        // Admin users list
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray());

        // Admin projects list
        mockMvc.perform(get("/api/admin/projects")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects").isArray());

        // Admin applications list
        mockMvc.perform(get("/api/admin/applications")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray());
    }

    @Test
    @Order(13)
    void testRoleBasedAccessControlBlocksUnauthorizedRoles() throws Exception {
        // Freelancer cannot access admin dashboard
        mockMvc.perform(get("/api/admin/dashboard")
                .header("Authorization", "Bearer " + freelancerToken))
                .andExpect(status().isForbidden());

        // Client cannot access admin dashboard
        mockMvc.perform(get("/api/admin/dashboard")
                .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());

        // Anonymous user cannot access client projects
        mockMvc.perform(get("/api/projects/client/my"))
                .andExpect(status().isForbidden());
    }
}

