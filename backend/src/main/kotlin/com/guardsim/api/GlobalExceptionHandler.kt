package com.guardsim.api

import com.guardsim.dto.ErrorResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(ex: ResponseStatusException): ResponseEntity<ErrorResponse> {
        val status = HttpStatus.valueOf(ex.statusCode.value())
        val msg = ex.reason ?: "Ошибка запроса"
        return ResponseEntity.status(status).body(ErrorResponse(msg))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val msg = ex.bindingResult.fieldErrors.joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.badRequest().body(ErrorResponse(msg))
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadable(ex: HttpMessageNotReadableException): ResponseEntity<ErrorResponse> =
        ResponseEntity.badRequest().body(ErrorResponse("Некорректное тело запроса"))

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArg(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> =
        ResponseEntity.badRequest().body(ErrorResponse(ex.message ?: "Ошибка"))
}
