export const createcatsAndSubcats = async (photoGallery) => {
  const {
    childhood = [],
    experience = [],
    relationship = {},
  } = await photoGallery;

  let currentIndex = 0;
  const cats = [];
  const subcats = [];

  // 유년시절
  const childhoodCount = await childhood.length;
  cats.push({
    name: "유년시절",
    start: currentIndex,
    end: currentIndex + childhoodCount - 1,
  });
  currentIndex += await childhoodCount;

  // 소중한 경험
  const expStart = await currentIndex;
  await experience.forEach((exp) => {
    const photoCount = exp.photos?.length || 0;
    subcats.push({
      name: exp.title || "무제 경험",
      start: currentIndex,
      end: currentIndex + photoCount - 1,
    });
    currentIndex += photoCount;
  });
  const expEnd = (await currentIndex) - 1;
  await cats.push({ name: "소중한 경험", start: expStart, end: expEnd });

  // 소중한 사람
  const relStart = await currentIndex;
  await Object.values(relationship).forEach((rel) => {
    const photoCount = rel.photos?.length || 0;
    subcats.push({
      name: rel.name || "무제 관계",
      start: currentIndex,
      end: currentIndex + photoCount - 1,
    });
    currentIndex += photoCount;
  });
  const relEnd = (await currentIndex) - 1;
  await cats.push({ name: "소중한 사람", start: relStart, end: relEnd });
  const total = relEnd + 1;

  console.log(cats, subcats);
  return await { total, cats, subcats };
};

