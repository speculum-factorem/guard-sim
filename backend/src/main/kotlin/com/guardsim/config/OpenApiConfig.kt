package com.guardsim.config

import com.guardsim.api.GuardSimHeaders
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun guardsimOpenApi(): OpenAPI =
        OpenAPI()
            .info(
                Info()
                    .title("GuardSim API")
                    .version("1.0")
                    .description(
                        """
                        REST API симулятора защиты данных **GuardSim** (КиберСтоп).

                        **Кто вы такой для API**
                        - Либо заголовок **`Authorization: Bearer …`** с токеном из `POST /api/auth/login` или `/api/auth/register`,
                        - либо заголовок **`${GuardSimHeaders.PLAYER_ID}`** с UUID клиентского игрока.

                        **Гостевой режим (без регистрации в БД):** для игровых методов добавьте **`${GuardSimHeaders.DEMO}: 1`** (допустимы также `true` / `yes`).

                        Интерактивная документация: **`/swagger-ui.html`**, OpenAPI JSON: **`/v3/api-docs`**.
                        """.trimIndent(),
                    ),
            )
            .components(
                Components()
                    .addSecuritySchemes(
                        "bearerJwt",
                        SecurityScheme()
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                            .description("Токен из ответа `/api/auth/login` или `/api/auth/register`."),
                    )
                    .addSecuritySchemes(
                        "playerId",
                        SecurityScheme()
                            .type(SecurityScheme.Type.APIKEY)
                            .`in`(SecurityScheme.In.HEADER)
                            .name(GuardSimHeaders.PLAYER_ID)
                            .description("UUID игрока. Используется, если не передан Bearer JWT."),
                    )
                    .addSecuritySchemes(
                        "demoMode",
                        SecurityScheme()
                            .type(SecurityScheme.Type.APIKEY)
                            .`in`(SecurityScheme.In.HEADER)
                            .name(GuardSimHeaders.DEMO)
                            .description("Передайте `1` для гостевого доступа к сценариям и сессиям без записи пользователя в БД."),
                    ),
            )
}
