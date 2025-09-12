import { useRouter } from 'expo-router';

import { CameraCapture } from '../../components/CameraCapture';

export default function CameraScan() {
  const router = useRouter();
  return <CameraCapture onClose={() => router.back()} />;
}
