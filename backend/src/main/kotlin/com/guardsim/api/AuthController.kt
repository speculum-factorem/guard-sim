package com.guardsim.api

import com.guardsim.auth.AuthService
import com.guardsim.dto.AuthResponseDto
import com.guardsim.dto.LoginRequest
import com.guardsim.dto.RegisterRequest
import com.guardsim.dto.UserMeDto
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {

    @PostMapping("/register")
    fun register(@Valid @RequestBody body: RegisterRequest): AuthResponseDto =
        authService.register(body.email, body.password)

    @PostMapping("/login")
    fun login(@Valid @RequestBody body: LoginRequest): AuthResponseDto =
        authService.login(body.email, body.password)

    @GetMapping("/me")
    fun me(request: HttpServletRequest): UserMeDto =
        authService.meFromRequest(request)
}
