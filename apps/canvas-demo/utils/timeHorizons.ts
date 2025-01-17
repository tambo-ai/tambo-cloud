import { subYears, startOfYear } from "date-fns";

export const defaultTimeHorizons: {
  label: string;
  value: string;
  getDates: () => { from: Date; to: Date };
}[] = [
  {
    label: "YTD",
    value: "ytd",
    getDates: () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "1Y",
    value: "1y",
    getDates: () => ({
      from: subYears(new Date(), 1),
      to: new Date(),
    }),
  },
  {
    label: "3Y",
    value: "3y",
    getDates: () => ({
      from: subYears(new Date(), 3),
      to: new Date(),
    }),
  },
  {
    label: "5Y",
    value: "5y",
    getDates: () => ({
      from: subYears(new Date(), 5),
      to: new Date(),
    }),
  },
  {
    label: "10Y",
    value: "10y",
    getDates: () => ({
      from: subYears(new Date(), 10),
      to: new Date(),
    }),
  },
];
