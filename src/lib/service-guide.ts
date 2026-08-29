/**
 * Short service identities for the live app.
 * Matching, PayPal/cash, and 90/10 stay as they are — this is product copy + UX.
 */
export const SERVICE_COPY = {
  trip: {
    title: "Trip",
    blurb:
      "Standard ride from pickup to drop-off. Nearest driver, live tracking, cash or PayPal.",
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
      "One extra stop on the way — spaza, grocery, hardware, or clinic. Added to your trip total, not a second booking.",
  },
  delivery: {
    title: "Fetch",
    blurb:
      "Driver collects or buys and brings it to you — shop list, farm goods, or clinic meds. You pay for goods at the shop. Village Ride charges the Fetch fee only.",
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
      "I know the shop — send a shopping list. Or find a shop for me from menus nearby. You pay for goods at the shop. Village Ride only charges the delivery fee — cash or PayPal.",
  },
  shopAndDeliver: {
    title: "I know the shop",
    blurb:
      "Write the shop name and a shopping list. The driver buys the items (you pay at the till) and brings them to you. Village Ride charges the delivery fee only.",
  },
  restaurantPickup: {
    title: "Find a shop for me",
    blurb:
      "Browse local kitchens and stores. The driver collects prepared food or goods and delivers.",
  },
} as const;
