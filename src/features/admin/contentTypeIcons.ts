import { Ionicons } from '@expo/vector-icons';
import type { PostStatus, PostType } from '../../repositories/contentRepository';

export const contentTypeIcons: Record<PostType, keyof typeof Ionicons.glyphMap> = {
  video: 'play-circle-outline',
  article: 'document-text-outline',
  teacher_tip: 'bulb-outline',
  problem: 'help-buoy-outline',
  question: 'help-circle-outline',
  poll: 'stats-chart-outline',
  exam: 'school-outline',
  test: 'clipboard-outline',
  resource: 'folder-open-outline',
  announcement: 'megaphone-outline'
};

export const statusColors: Record<PostStatus, { bg: string; fg: string }> = {
  draft: { bg: '#F2E4B70D', fg: '#B08900' },
  published: { bg: '#1B7F4D14', fg: '#1B7F4D' },
  hidden: { bg: '#B4231814', fg: '#B42318' }
};

export const statusIcons: Record<PostStatus, keyof typeof Ionicons.glyphMap> = {
  draft: 'create-outline',
  published: 'checkmark-circle-outline',
  hidden: 'eye-off-outline'
};
