import { useSpring } from "framer-motion";
function CameraZoom({ mode }) {
  const { camera, size } = useThree();
  const zoom = useSpring(mode === "default" ? 1.15 : 1.0, { stiffness: 180, damping: 20 });
  useFrame(() => { camera.zoom = zoom.get(); camera.updateProjectionMatrix(); });
  React.useEffect(() => { camera.aspect = size.width / size.height; camera.updateProjectionMatrix(); }, [camera, size]);
  return null;
}
