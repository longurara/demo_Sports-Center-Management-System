import gym from '../../assets/sports/gym.jpg';
import yoga from '../../assets/sports/yoga.jpg';
import boxing from '../../assets/sports/boxing.jpg';
import swim from '../../assets/sports/swim.jpg';
import badminton from '../../assets/sports/badminton.jpg';
import tennis from '../../assets/sports/tennis.jpg';
import pickleball from '../../assets/sports/pickleball.jpg';
import basketball from '../../assets/sports/basketball.jpg';
import zumba from '../../assets/sports/zumba.jpg';
import football from '../../assets/sports/football.jpg';

/** Ảnh minh họa theo id bộ môn trong mock data (ảnh Unsplash, muốn thay chỉ cần ghi đè file cùng tên trong assets/sports). */
export const SPORT_IMAGES: Record<string, string> = {
  sp1: gym, sp2: yoga, sp3: boxing, sp4: swim, sp5: badminton, sp6: tennis, sp7: pickleball, sp8: basketball, sp9: zumba, sp10: football,
};
