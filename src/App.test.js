import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app home header', () => {
  render(<App />);
  expect(screen.getByText(/Predict Games & Players/i)).toBeInTheDocument();
});
