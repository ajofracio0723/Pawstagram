import Button from "../Components/Button"
import SectionTv from "../Components/SectionTv"
import SectionHp from "../Components/SectionHp"
import Gallery from "../Components/UploadImages"

const Home = () => {
	return (
		<>
			<section className="SectionImage" id="section1">
				<div className="LeftText">
					<b>Pawstagram</b>
					<p className="relative bottom-3">
						Join us and feel the warmth of a close social relationship between fellow dog lovers.
						Make this place a forum for exchanging information, uploading adorable photos, and
						discussing various tips and tricks for caring for dogs.
					</p>
					<div className="ButtonNext">
						<Button />
					</div>
				</div>
				<div className="ContainerTitle">
					<div className="TextNetflix">
						<img src="images/netflix.png" alt="" />
					</div>
				</div>
			</section>
			<SectionTv />
			<SectionHp />

			<Gallery id="Gallery" />
		</>
	)
}

export default Home