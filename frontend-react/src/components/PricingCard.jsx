function PricingCard(props) {

    return (

        <div
            className={`pricing-card ${props.highlight ? "highlight" : ""}`}
        >

            <h3>
                {props.title}
            </h3>

            <p className="price">
                {props.price}
            </p>

            <ul>

                {props.features.map((feature, index) => (

                    <li key={index}>
                        {feature}
                    </li>

                ))}

            </ul>

            <button>
                Choose Plan
            </button>

        </div>

    )

}

export default PricingCard;