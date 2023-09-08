import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import './style.css';

export default function App() {
  const [data, setData] = useState([]);
  const [eligibleHotels, setEligibleHotels] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState([]);

  useEffect(() => {
    // Fetch eligible hotels
    fetch('https://www.mfamanagement.co.in/eligible_hotels')
      .then(response => response.json())
      .then(hotels => {
        setEligibleHotels(hotels);
        setSelectedHotels(hotels); // Initially select all hotels
      })
      .catch(error => console.error("Error fetching eligible hotels:", error));

    // Fetch market graph data
    fetchMarketGraphData();
  }, []);

  const fetchMarketGraphData = () => {
    fetch(`https://www.mfamanagement.co.in/market_graph1?hotels=${selectedHotels.join(',')}`)
      .then(response => response.json())
      .then(fetchedData => {
        setData(fetchedData);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  };

  const handleHotelSelection = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setSelectedHotels(selectedOptions);
    fetchMarketGraphData();
  };

  // ... (rest of your chartData, chartOptions, and rendering logic remains the same)
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
      <h1 className="title">RevAnalytica</h1>
      <p>Market Overview</p>
      <div>
        <label>Select Hotels: </label>
        <select multiple={true} onChange={handleHotelSelection}>
          {eligibleHotels.map(hotel => (
            <option key={hotel} value={hotel}>
              {hotel}
            </option>
          ))}
        </select>
      </div>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}
