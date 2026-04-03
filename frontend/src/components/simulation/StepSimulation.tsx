import type { ReactNode } from "react";
import type { ChoicePublic, StepPublic } from "../../types";
import { BrowserSimulation } from "./BrowserSimulation";
import { EmailClientSimulation } from "./EmailClientSimulation";
import { GenericWorkspaceSimulation } from "./GenericWorkspaceSimulation";
import { SocialFeedSimulation } from "./SocialFeedSimulation";
import { TicketSimulation } from "./TicketSimulation";

export function StepSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  /** Варианты ответа для режима «общий» (GENERIC), если у шага нет хотспотов */
  genericChoices: ChoicePublic[];
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, genericChoices, childrenFooter } = props;

  switch (step.uiKind) {
    case "EMAIL_CLIENT":
      return (
        <EmailClientSimulation step={step} disabled={disabled} onChoose={onChoose} childrenFooter={childrenFooter} />
      );
    case "SOCIAL_NOTIFICATION":
      return (
        <SocialFeedSimulation step={step} disabled={disabled} onChoose={onChoose} childrenFooter={childrenFooter} />
      );
    case "DESK_TICKET":
      return <TicketSimulation step={step} disabled={disabled} onChoose={onChoose} childrenFooter={childrenFooter} />;
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
        />
      );
  }
}
