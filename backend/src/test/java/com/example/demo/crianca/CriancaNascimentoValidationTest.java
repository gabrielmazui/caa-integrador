package com.example.demo.crianca;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CriancaNascimentoValidationTest {
    private static jakarta.validation.ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }

    @Test
    void acceptsBirthDateUpToOneHundredYearsAgo() {
        assertTrue(validator.validate(createRequest(LocalDate.now())).isEmpty());
        assertTrue(validator.validate(createRequest(LocalDate.now().minusYears(100))).isEmpty());
    }

    @Test
    void rejectsImplausibleAgeOnCreate() {
        var violations = validator.validate(createRequest(LocalDate.now().minusYears(200)));

        assertEquals(1, violations.size());
        var violation = violations.iterator().next();
        assertEquals("dataNascimento", violation.getPropertyPath().toString());
        assertEquals("a idade não pode ser maior que 100 anos", violation.getMessage());
    }

    @Test
    void rejectsBirthDateOlderThanOneHundredOnUpdate() {
        var request = new CriancaController.CriancaUpdateRequest(
            "Ana", LocalDate.now().minusYears(100).minusDays(1), null, null, null, null);

        assertEquals(1, validator.validate(request).size());
    }

    @Test
    void rejectsFutureBirthDate() {
        var violations = validator.validate(createRequest(LocalDate.now().plusDays(1)));

        assertEquals(1, violations.size());
        assertEquals("não pode estar no futuro", violations.iterator().next().getMessage());
    }

    @Test
    void keepsBirthDateOptional() {
        assertTrue(validator.validate(createRequest(null)).isEmpty());
    }

    private CriancaController.CriancaRequest createRequest(LocalDate birthDate) {
        return new CriancaController.CriancaRequest("Ana", birthDate, null, null, null);
    }
}
