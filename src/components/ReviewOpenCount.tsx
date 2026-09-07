import React from 'react';
import { useApp } from '../context/AppContext';
export function ReviewOpenCount({videoId}:{videoId:string}) {
  const { reviewOpenCounts,language } = useApp();
  return <span title={language==='ar' ? 'فتح المراجعة على الموقع، مرة لكل جلسة. ليست مشاهدات YouTube أو تشغيلات الفيديو. بدأ القياس في 7 سبتمبر 2026.' : 'Review opens on this site, once per session. Not YouTube views or video plays. Measurement started September 7, 2026.'}>
    {reviewOpenCounts === null ? (language==='ar' ? 'قياس الفتح غير متاح' : 'Open count unavailable')
      : `${reviewOpenCounts[videoId] || 0} ${language==='ar' ? 'فتح مسجّل للمراجعة' : 'recorded review opens'}`}
  </span>;
}
