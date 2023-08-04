/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51NYOtDBnLDE1AU4kizx8pFypS9oJ8KqfRHlpzD49WNxDlDmExfVPoO7GVuS7GZomKn4sDeeyf56LnDXf9UG5Evni00XuHZUUOw'
  );
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
