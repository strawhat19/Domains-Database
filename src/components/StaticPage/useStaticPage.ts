import { useState, useMemo } from 'react';
import { pageContent, type PageName } from '../../shared/pages';

const splitParagraph = (paragraph: string, limit: number) => {
  const sentences = paragraph.match(/[\s\S]+?(?:[.!?](?=\s)|$)/g) ?? [paragraph];
  const details: string[] = [];
  let detail = ``;

  sentences.forEach(sentence => {
    const text = sentence.trim();
    if (detail && `${detail} ${text}`.length > limit) {
      details.push(detail);
      detail = ``;
    }
    if (text.length > limit) {
      text.split(/\s+/).forEach(word => {
        if (detail && `${detail} ${word}`.length > limit) {
          details.push(detail);
          detail = ``;
        }
        detail = detail ? `${detail} ${word}` : word;
      });
    } else {
      detail = detail ? `${detail} ${text}` : text;
    }
  });
  if (detail) details.push(detail);
  return details;
};

export const useStaticPage = (page: PageName, detailLength = 310) => {
  const content = pageContent[page];
  const sections = useMemo(() => content.sections.map(section => ({
    ...section,
    details: section.body.flatMap(paragraph => splitParagraph(paragraph, detailLength)),
  })), [content, detailLength]);
  const [selection, setSelection] = useState({ page, topic: 0, detail: 0 });
  const requested = selection.page === page ? selection : { page, topic: 0, detail: 0 };
  const current = { ...requested, detail: Math.min(requested.detail, sections[requested.topic].details.length - 1) };
  const section = sections[current.topic];
  const selectTopic = (topic: number) => setSelection({ page, topic, detail: 0 });
  const moveDetail = (direction: -1 | 1) => {
    const detail = current.detail + direction;
    if (detail >= 0 && detail < section.details.length) {
      setSelection({ ...current, detail });
    } else {
      const topic = current.topic + direction;
      const nextSection = sections[topic];
      if (nextSection) setSelection({ page, topic, detail: direction > 0 ? 0 : nextSection.details.length - 1 });
    }
  };

  return {
    content,
    section,
    sections,
    moveDetail,
    selectTopic,
    topic: current.topic,
    detail: current.detail,
    paragraph: section.details[current.detail],
    first: current.topic === 0 && current.detail === 0,
    last: current.topic === sections.length - 1 && current.detail === section.details.length - 1,
  };
};
