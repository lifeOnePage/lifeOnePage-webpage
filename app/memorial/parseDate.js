// parseDate.js (도우미)

export function parseDate(dataItem) {
  const { date, season } = dataItem;
  // date: "yyyy.mm.dd" | "yyyy.mm" | "yyyy"

  let [year, month, day] = date.split(".");
  year = parseInt(year, 10);
  month = month ? parseInt(month, 10) : 1;
  day = day ? parseInt(day, 10) : 1;

  // season 필드가 있으면, 예: spring=3, summer=6, fall=9, winter=12
  if (date.match(/^\d{4}$/) && season) {
    switch (season) {
      case "spring":
        month = 3;
        break;
      case "summer":
        month = 6;
        break;
      case "fall":
        month = 9;
        break;
      case "winter":
        month = 12;
        break;
      default:
        break;
    }
  }

  return new Date(year, month - 1, day);
}
