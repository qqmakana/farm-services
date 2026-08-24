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
    title: "Groups",
    blurb:
      "Share a ride with others going the same way — max 4 passengers, 60% of a private Trip fare.",
  },
  delivery: {
    title: "Delivery",
    blurb:
      "Any item that isn’t a restaurant meal — boxes, furniture, hardware. Weight sets the fare. Driver photos the load at pickup and drop-off.",
  },
  courier: {
    title: "Courier",
    blurb:
      "Documents or a small package, curb-to-curb, under 15 kg. Flat distance fare — no weight charge. Share the trip link so the recipient can track without the app.",
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
