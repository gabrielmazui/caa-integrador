package com.example.demo.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;

public class NotOlderThanValidator implements ConstraintValidator<NotOlderThan, LocalDate> {
    private int maximumAge;

    @Override
    public void initialize(NotOlderThan constraint) {
        maximumAge = constraint.years();
    }

    @Override
    public boolean isValid(LocalDate value, ConstraintValidatorContext context) {
        return value == null || !value.isBefore(LocalDate.now().minusYears(maximumAge));
    }
}
