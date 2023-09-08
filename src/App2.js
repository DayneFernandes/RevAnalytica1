import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import './style.css';

export default function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('https://www.mfamanagement.co.in/market_graph')

      .then(response => response.json())
      .then(fetchedData => {
        setData(fetchedData);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Price Range',
        data: data.map(d => d.max - d.min), // Height of the bar represents the range
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        barThickness: 20, // Adjust as needed
        base: data.map(d => d.min) // Starting point of the bar
      },
      {
        label: 'My Hotel Price',
        data: data.map(d => d.my_price),
        type: 'line',
        borderColor: 'blue',
        fill: false
      }
    ]
  };






  // Determine the maximum value from all datasets
  const maxVal = Math.max(
    ...data.map(d => d.min),
    ...data.map(d => d.max),
    ...data.map(d => d.my_price)
  );

  // Set the y-axis max value to be 10% higher than the maximum value
  const yAxisMax = maxVal + (0.10 * maxVal);

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'category',
      },
      y: {
        type: 'linear',
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Market Overview' // Updated chart title
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            const dataIndex = context.dataIndex;
            const myPrice = data[dataIndex].my_price;
            const minPrice = data[dataIndex].min;
            const maxPrice = data[dataIndex].max;
            const medianPrice = data[dataIndex].median;

            switch (context.datasetIndex) {
              case 0: // Bar (Price Range)
                return [
                  `My Hotel Price: ${myPrice}`,
                  `Price Range: ${minPrice}-${maxPrice}`,
                  `Median Price: ${medianPrice}`
                ];
              case 1: // Line (My Hotel Price)
                return `My Hotel Price: ${myPrice}`;
              default:
                return '';
            }
          }
        }
      }
    }
  };

  return (
    <div>
      <h1 style={{ fontWeight: 'bold', textAlign: 'center' }}>RevAnalytica</h1> {/* Updated title with bold styling and centered alignment */}
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}
