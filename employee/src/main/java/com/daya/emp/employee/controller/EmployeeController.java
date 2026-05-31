package com.daya.emp.employee.controller;

import com.daya.emp.employee.model.Employee;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api")
public class EmployeeController {

    private static final Logger log = LoggerFactory.getLogger(EmployeeController.class);
    private final Environment env;
    private final WebClient webClient;

    public EmployeeController(Environment env, WebClient webClient) {
        this.env = env;
        this.webClient = webClient;
    }

    @GetMapping("/hello")
    public String hello() {
        log.info("Entering hello method");
        String response = "Welcome to Demo";
        log.info("Exiting hello method");
        return response;
    }

    @GetMapping("/employees")
    public List<Employee> employees() {
        log.info("Entering employees method");
        List<Employee> employeeList = Arrays.asList(
                new Employee(1L, "Alice", "Developer"),
                new Employee(2L, "Bob", "Manager"),
                new Employee(3L, "Carol", "QA"),
                new Employee(4L, "Daya", "Designer"),
                new Employee(5L, "Eve", "DevOps")
        );
        log.info("Returning employees: {}", employeeList);
        log.info("Exiting employees method");
        return employeeList;
    }

    @GetMapping("/profile")
    public List<String> activeProfiles() {
        log.info("Entering activeProfiles method");
        String[] profiles = env.getActiveProfiles();
        List<String> profileList;
        if (profiles.length == 0) {
            profileList = Collections.singletonList("default");
        } else {
            profileList = Arrays.asList(profiles);
        }
        log.info("Returning active profiles: {}", profileList);
        log.info("Exiting activeProfiles method");
        return profileList;
    }

    @GetMapping("/envmsg")
    public String environmentMessage() {
        log.info("Entering environmentMessage method");
        // Read the property 'poc.environment.msg' from the active environment (application-*.properties)
        String msg = env.getProperty("poc.environment.msg")+"added to test ci/cd"+"testing deploy";
        log.info("Returning environment message: {}", msg);
        log.info("Exiting environmentMessage method");
        return msg;
    }

    @GetMapping("/departments")
    public Mono<String> departments() {
        log.info("Entering departments method");
        return webClient.get()
                .uri("http://department/api/list")
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(response -> {
                    log.info("Response from department service: {}", response);
                    log.info("Exiting departments method successfully.");
                })
                .doOnError(error -> log.error("Error occurred in departments method.", error));
    }
}
