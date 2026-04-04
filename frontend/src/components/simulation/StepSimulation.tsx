import type { ReactNode } from "react";
import type { ChoicePublic, StepPublic } from "../../types";
import { BrowserSimulation } from "./BrowserSimulation";
import { CalendarInviteSimulation } from "./CalendarInviteSimulation";
import { ChatMessengerSimulation } from "./ChatMessengerSimulation";
import { EmailClientSimulation } from "./EmailClientSimulation";
import { ExtensionStoreSimulation } from "./ExtensionStoreSimulation";
import { GenericWorkspaceSimulation } from "./GenericWorkspaceSimulation";
import { OAuthApprovalSimulation } from "./OAuthApprovalSimulation";
import { SocialFeedSimulation } from "./SocialFeedSimulation";
import { TerminalSessionSimulation } from "./TerminalSessionSimulation";
import { TicketSimulation } from "./TicketSimulation";

export function StepSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  /** Варианты ответа для режима «общий» (GENERIC), если у шага нет хотспотов */
  genericChoices: ChoicePublic[];
  childrenFooter?: ReactNode;
  /** Режим «как LeetCode»: условие слева, интерфейс справа — длинный текст не дублируется в макете справа */
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, genericChoices, childrenFooter, splitLayout = false } = props;

  switch (step.uiKind) {
    case "EMAIL_CLIENT":
      return (
        <EmailClientSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "SOCIAL_NOTIFICATION":
      return (
        <SocialFeedSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "DESK_TICKET":
      return (
        <TicketSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "MINI_URL_COMPARE":
      if (step.urlCompareGame) {
        return (
          <BrowserSimulation step={step} disabled={disabled} onChoose={onChoose} childrenFooter={childrenFooter} />
        );
      }
      return (
        <GenericWorkspaceSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          choiceButtons={genericChoices}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "CHAT_MESSENGER":
      return (
        <ChatMessengerSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "CALENDAR_INVITE":
      return (
        <CalendarInviteSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "EXTENSION_STORE":
      return (
        <ExtensionStoreSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "TERMINAL_SESSION":
      return (
        <TerminalSessionSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    case "OAUTH_APPROVAL":
      return (
        <OAuthApprovalSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
    default:
      return (
        <GenericWorkspaceSimulation
          step={step}
          disabled={disabled}
          onChoose={onChoose}
          choiceButtons={genericChoices}
          childrenFooter={childrenFooter}
          splitLayout={splitLayout}
        />
      );
  }
}
