package com.guardsim.scenario

import com.guardsim.scenario.internal.InternalChoice
import com.guardsim.scenario.internal.InternalHotspot
import com.guardsim.scenario.internal.InternalInvestigationPanel
import com.guardsim.scenario.internal.InternalRedFlagCandidate
import com.guardsim.scenario.internal.InternalRedFlagGame
import com.guardsim.scenario.ScenarioHubChannel
import com.guardsim.scenario.internal.InternalScenario
import com.guardsim.scenario.internal.InternalStep
import com.guardsim.scenario.internal.InternalUrlCompareGame
import com.guardsim.scenario.internal.StepUiKind
import org.springframework.stereotype.Component

@Component
class ScenarioRegistry {

    private val byId: Map<String, InternalScenario> = buildAll().associateBy { it.id }

    fun all(): Collection<InternalScenario> = byId.values

    fun findById(id: String): InternalScenario? = byId[id]

    private companion object {
        fun buildAll(): List<InternalScenario> =
            listOf(
                phishingEmail(),
                socialPrizeScam(),
                maliciousAttachment(),
                combinedAttack(),
                vendorPaymentBec(),
                marketplaceOffPlatform(),
                hrPortalPhish(),
                itSupportLookalike(),
                execWireVishing(),
            )

        /** Фишинговое письмо «срочная смена пароля». */
        fun phishingEmail(): InternalScenario = InternalScenario(
            id = "phishing-email",
            title = "Срочное письмо от «банка»",
            type = ScenarioType.EMAIL,
            description = "Проверьте, как вы распознаёте фишинг в почте и что делать с подозрительными письмами.",
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
        )

        /** Соцсеть: «вы выиграли», просьба ввести пароль. */
        fun socialPrizeScam(): InternalScenario = InternalScenario(
            id = "social-prize",
            title = "«Поздравляем» во ВКонтакте",
            type = ScenarioType.SOCIAL,
            description = "Разбор типичной схемы в соцсети: фальшивые розыгрыши и кража учётных данных.",
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
                            label = "Обновлю реквизиты в ERP и платёжке по этому письму — счёт уже согласован",
                            correct = false,
                            explanationWhenChosen = "Изменение платёжных данных по одному письму — частый сценарий мошенников. Домен может отличаться на один сегмент от настоящего.",
                            scoreDelta = 0,
                            criticalIfWrong = true,
                            consequenceBeat = "Платёж ушёл на счёт мошенников. Возврат средств не гарантирован, контрагент и аудит задают вопросы.",
                        ),
                        InternalChoice(
                            id = "vb-1-b",
                            label = "Сверю реквизиты по звонку на номер из действующего договора или официального каталога, не из этого письма",
                            correct = true,
                            explanationWhenChosen = "Независимый канал с контактом, известным до письма, — стандарт при любых изменениях оплаты.",
                            scoreDelta = 4,
                        ),
                        InternalChoice(
                            id = "vb-1-c",
                            label = "Отвечу отправителю: «Подтвердите с корпоративного адреса»",
                            correct = false,
                            explanationWhenChosen = "Ответ на тот же ящик может получить тот же атакующий. Нужна проверка по телефону из доверенного источника.",
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
                            label = "Обновить реквизиты в системе по письму",
                            choiceId = "vb-1-a",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "vb-1-h-b",
                            label = "Позвонить по номеру из договора",
                            choiceId = "vb-1-b",
                            variant = "ACTION",
                        ),
                        InternalHotspot(
                            id = "vb-1-h-c",
                            label = "Ответить отправителю в почте",
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
                    narrative = "Вы не меняли реквизиты по этому письму. Что сделать дальше?",
                    choices = listOf(
                        InternalChoice(
                            id = "vb-2-a",
                            label = "Сообщить в ИБ и финансам по регламенту, сохранить письмо и заголовки",
                            correct = true,
                            explanationWhenChosen = "Фиксация инцидента помогает заблокировать домен и предупредить других закупщиков.",
                            scoreDelta = 3,
                        ),
                        InternalChoice(
                            id = "vb-2-b",
                            label = "Удалить письмо — деньги же не отправили",
                            correct = false,
                            explanationWhenChosen = "Даже без перевода атаку стоит регистрировать: мошенники могут нацелиться на коллег.",
                            scoreDelta = 0,
                        ),
                        InternalChoice(
                            id = "vb-2-c",
                            label = "Написать в общий чат с поставщиком «кому верить?»",
                            correct = false,
                            explanationWhenChosen = "Публичные чаты раскрывают процессы. Лучше официальные каналы и тикет в ИБ.",
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
    }
}
