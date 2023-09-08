import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import './style.css';
import './App.css';
import moment from 'moment';

function parseCustomDate(dateStr) {
  let month, day, year;
  if (dateStr.length === 7) { // MDDYYYY
      month = dateStr.substring(0, 1);
      day = dateStr.substring(1, 3);
      year = dateStr.substring(3, 7);
  } else if (dateStr.length === 8) { // MMDDYYYY
      month = dateStr.substring(0, 2);
      day = dateStr.substring(2, 4);
      year = dateStr.substring(4, 8);
  } else {
      return null; // Invalid format
  }
  return moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
}




export default function App() {
  const [data, setData] = useState([]);
  const [eligibleHotels, setEligibleHotels] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectAll, setSelectAll] = useState(true); // New state for select all

  useEffect(() => {
    fetch('https://www.mfamanagement.co.in/eligible_hotels')
      .then(response => response.json())
      .then(hotels => {
        setEligibleHotels(hotels.sort()); // Sort alphabetically
        setSelectedHotels(hotels); // Initially select all hotels
      })
      .catch(error => console.error("Error fetching eligible hotels:", error));
}, []); // Empty dependency array

// This useEffect is for fetching market graph data whenever selectedHotels changes.
useEffect(() => {
    fetchMarketGraphData();
}, [selectedHotels]);// Add selectedHotels as a dependency

  const fetchMarketGraphData = () => {
    const hotelsString = selectedHotels.join('|');  // Convert the array to a string
      // Log the string

    fetch(`https://www.mfamanagement.co.in/market_graph1?hotels=${hotelsString}`)
      .then(response => response.json())
      .then(fetchedData => {
        setData(fetchedData);
        console.log("Hotels data for the bar chart:", fetchedData);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });

  };

  const handleHotelSelection = (action) => {
    if (action === "selectAll") {
        setSelectedHotels(eligibleHotels);
        setSelectAll(true);
    } else if (action === "unselectAll") {
        setSelectedHotels([]);
        setSelectAll(false);
    } else {
        if (selectedHotels.includes(action)) {
            setSelectedHotels(prevHotels => prevHotels.filter(h => h !== action));
        } else {
            setSelectedHotels(prevHotels => [...prevHotels, action]);
        }
    }
};


  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  // ... (rest of your chartData, chartOptions, and rendering logic remains the same)
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Price Range',
        data: data.map(d => [d.min, d.max]),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        barThickness: 20,
      },
      {
        label: 'My Hotel Price',
        data: data.map(d => d.my_price),
        type: 'line',
        borderColor: 'blue',
        fill: false,
        borderDash: [5, 5],
        pointRadius: 6,  // This will make the dot bigger
        pointBackgroundColor: 'blue'
      },
      {
        label: 'Median Price',
        data: data.map(d => d.median),
        type: 'scatter',
        borderColor: 'transparent',
        pointBorderColor: 'red',
        pointBackgroundColor: 'red',
        pointStyle: 'rectRounded',
        pointRadius: data.map(() => 7),
        fill: false,
        showLine: false
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
        title: {
          display: true,
          text: 'INR'  // This sets the Y-axis title to "INR"
        },
        
      },
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end', 
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
      <div className="dropdown">
        <button onClick={toggleDropdown}>Select Hotels</button>
        {showDropdown && (
          <div className="dropdown-content">
            <div>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={() => handleHotelSelection("selectAll")}
              />
              Select All
            </div>
            <div>
              <input
                type="checkbox"
                checked={!selectAll}
                onChange={() => handleHotelSelection("unselectAll")}
              />
              Unselect All
            </div>
            {eligibleHotels.map(hotel => (
              <div key={hotel}>
                <input
                  type="checkbox"
                  checked={selectedHotels.includes(hotel)}
                  onChange={() => handleHotelSelection(hotel)}
                />
                {hotel}
              </div>
            ))}
            <button onClick={fetchMarketGraphData}>Update Chart</button>

          </div>
        )}
      </div>
      <Bar key={selectedHotels.join('|')} data={chartData} options={chartOptions} />
    
    </div>
  );
}