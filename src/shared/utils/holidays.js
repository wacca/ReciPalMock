// 祝日参照のファサード。実体は holidayStore.js（localStorage）に持つ。
// 旧APIを維持しつつ管理画面で編集された内容を反映する。
import { lookupHoliday } from './holidayStore';

export const getHolidayName = (dateKey) => {
    const rec = lookupHoliday(dateKey);
    return rec ? rec.name : null;
};
export const isHoliday = (dateKey) => Boolean(lookupHoliday(dateKey));
