package com.guardsim.api

import com.guardsim.auth.AuthService
import com.guardsim.dto.AuthResponseDto
import com.guardsim.dto.LoginRequest
import com.guardsim.dto.RegisterRequest
import com.guardsim.dto.UserMeDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.security.SecurityRequirements
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Авторизация", description = "Регистрация, вход и профиль")
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {

    @Operation(summary = "Регистрация", description = "Создаёт пользователя, игрока и возвращает JWT.")
    @PostMapping("/register")
    fun register(@Valid @RequestBody body: RegisterRequest): AuthResponseDto =
        authService.register(body.email, body.password)

    @Operation(summary = "Вход", description = "Проверяет email и пароль, возвращает JWT.")
    @PostMapping("/login")
    fun login(@Valid @RequestBody body: LoginRequest): AuthResponseDto =
        authService.login(body.email, body.password)

    @Operation(
        summary = "Текущий профиль",
        description = "С валидным Bearer — данные аккаунта. Только с заголовком X-GuardSim-Player — гостевой профиль (guest=true, email=null).",
    )
    @SecurityRequirements(
        SecurityRequirement(name = "bearerJwt"),
        SecurityRequirement(name = "playerId"),
    )
    @GetMapping("/me")
    fun me(request: HttpServletRequest): UserMeDto =
        authService.meFromRequest(request)
}
