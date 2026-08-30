/**
 * Short service identities for the live app.
 * Matching, PayPal/cash, and 90/10 stay as they are — this is product copy + UX.
 */
export const SERVICE_COPY = {
  trip: {
    title: "Trip",
    blurb:
      "Standard ride from pickup to drop-off. Nearest driver, live tracking, cash or card (Yoco).",
  },
  reserve: {
    title: "Reserve",
    blurb:
      "Book 30 minutes to 30 days ahead. Includes a reservation fee. Driver aims to arrive early and wait up to 5 minutes. Cancel free until 1 hour before pickup.",
  },
  groups: {
    title: "People",
    blurb:
      "Same Village Ride sedan. Pick Solo, 2, or 4 after you set a destination — fare stays one bundled price.",
  },
  tripStop: {
    title: "Trip + stop",
    blurb:
      "Going somewhere and need the shop or clinic on the way? Book one trip. The driver stops once with you, then continues. +R15, already in the fare — not a second booking. If you are not going along, use Fetch instead.",
    tile:
      "Need the shop or clinic on the way? One stop with you in the car. +R15 in the same fare.",
  },
  delivery: {
    title: "Fetch",
    blurb:
      "Not on the app? Type a list — shop, farm, or clinic. The driver buys and brings it. You pay for goods at the till. Village Ride charges the Fetch fee only. To browse a shop menu and pay in-app, use Shops.",
  },
  courier: {
    title: "Send",
    blurb:
      "Send a parcel to someone else — documents or a small package, curb-to-curb. Share the trip link so the recipient can track without the app.",
  },
  safety: {
    title: "Safety",
    blurb:
      "Panic code in chat, confirm you arrived safely, and see your driver’s live photo before pickup.",
  },
  farm: {
    title: "Farm",
    blurb:
      "Farm-to-market logistics: produce, feed, or equipment. Bakkie or truck only. Driver can help load and unload. Now or scheduled.",
  },
  shops: {
    title: "Shops",
    blurb:
      "Browse a shop on Village Ride, add to cart, pay in-app (Yoco) or cash. Delivery R35. Shop not listed? Use Fetch and pay for goods at the till.",
  },
  shopAndDeliver: {
    title: "I know the shop",
    blurb:
      "Write the shop name and a list. The driver buys the items — you pay at the till. Village Ride charges the Fetch fee only. Shop on the app? Open Shops and pay in-app.",
  },
  restaurantPickup: {
    title: "Find a shop for me",
    blurb:
      "Browse local kitchens and stores. The driver collects prepared food or goods and delivers.",
  },
} as const;
