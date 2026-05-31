package com.daya.department;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class DepartmentService {

    public List<Department> getDepartments() {
        return Arrays.asList(
                new Department(1L, "HR", "New York"),
                new Department(2L, "Engineering", "San Francisco"),
                new Department(3L, "Sales", "Chicago")
        );
    }
}

