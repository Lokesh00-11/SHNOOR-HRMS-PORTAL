function InfoSection(props) {

    return (

        <section className={`section ${props.light ? "section-light" : ""}`}>

            <div className={`container section-grid ${props.reversed ? "reversed" : ""}`}>

                <div className="section-image">

                    <img
                        src={props.image}
                        alt={props.title}
                    />

                </div>

                <div className="section-content">

                    <h2 className="gradient-text">

                        {props.title}

                    </h2>

                    <p>

                        {props.description}

                    </p>

                    <div className="feature-list">

                        {props.features.map((feature, index) => (

                            <div className="feature-item" key={index}>

                                <div className="feature-item-icon">

                                    {feature.icon}

                                </div>

                                <div className="feature-item-text">

                                    <h4>
                                        {feature.title}
                                    </h4>

                                    <p>
                                        {feature.description}
                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

        </section>

    )

}

export default InfoSection;