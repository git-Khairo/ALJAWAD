import ReactDOM from 'react-dom/client';
import '../css/app.css';

const App = () => {
    return(
        <div className="bg-blue-500 text-white p-4">
            Hello Tailwind!
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('app')).render(<App/>)
export default App;
