package com.daya.department;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DepartmentController {

    @Autowired
   Environment env;

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping("/list")
    public List<Department> list() {
        return departmentService.getDepartments();
    }

    @GetMapping("/envmsg")
    public String environmentMessage() {
        // Read the property 'poc.environment.msg' from the active environment (application-*.properties)
        String msg = env.getProperty("poc.environment.msg");
        return msg != null ? msg : "not found";
    }
}
