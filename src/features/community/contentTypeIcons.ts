import { Ionicons } from '@expo/vector-icons';
import type { CommunityPostType } from '../../repositories/communityRepository';

export const communityTypeIcons: Record<CommunityPostType, keyof typeof Ionicons.glyphMap> = {
  text: 'chatbubble-ellipses-outline',
  image: 'image-outline',
  pdf: 'document-attach-outline',
  question: 'help-circle-outline',
  idea: 'bulb-outline',
  exam: 'school-outline',
  test: 'clipboard-outline',
  resource: 'folder-open-outline',
  classroom_experience: 'easel-outline',
  tip: 'sparkles-outline'
};
