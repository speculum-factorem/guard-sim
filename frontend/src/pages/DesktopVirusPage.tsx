import { Navigate, useParams } from "react-router-dom";
import { DesktopVirusSimulation } from "../components/desktop-virus/DesktopVirusSimulation";
import { isDesktopVirusId } from "../components/desktop-virus/desktopVirusCatalog";

export function DesktopVirusPage() {
  const { virusId } = useParams<{ virusId?: string }>();
  if (virusId != null && virusId !== "" && !isDesktopVirusId(virusId)) {
    return <Navigate to="/desktop-virus" replace />;
  }
  const id = virusId && isDesktopVirusId(virusId) ? virusId : null;
  return (
    <div className="dvs-root">
      <DesktopVirusSimulation virusId={id} />
    </div>
  );
}
