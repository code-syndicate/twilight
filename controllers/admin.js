const User = require('./../models/user');
const {Deposit, Withdrawal} = require('./../models/transaction');
const {body, validationResult} = require('express-validator');

function logIn(req, res) {
	res.locals.authError = req.flash('error');
	res.locals.formErrors = req.flash('formErrors');
	res.render('admin_login');
}

async function overview(req, res) {
	let UI = req.query.ui || 'main';

	const uis = ['main', 'users', 'deposits', 'withdrawals'];

	if (!uis.includes(UI)) UI = 'main';

	const clients = await User.find({}).lean().exec();
	const deposits = await Deposit.find({client: req.user.id})
		.populate('client')
		.lean()
		.exec();
	const withdrawals = await Withdrawal.find({client: req.user.id})
		.populate('client')
		.lean()
		.exec();

	res.locals.authError = req.flash('error');
	res.locals.formErrors = req.flash('formErrors');

	res.render('admin_overview', {
		clients,
		deposits,
		withdrawals,
		ui: UI,
		user: req.user,
	});
}

const editClient = [
	body('wallet', 'Wallet balance is required')
		.notEmpty()
		.isNumeric()
		.withMessage('Please enter a valid wallet amount'),
	body('bonus', 'Bonus balance is required')
		.notEmpty()
		.isNumeric()
		.withMessage('Please enter a valid bonus amount'),
	body('profit', 'Profit balance is required')
		.notEmpty()
		.isNumeric()
		.withMessage('Please enter a valid profit amount'),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash('formErrors', errors.array());
			res.redirect('/admin/overview/?ui=users');
			return;
		}

		let client = await User.findById(req.body.clientId).exec();
		client.wallet = req.body.wallet;
		client.bonus = req.body.bonus;
		client.profits = req.body.profit;

		await client.save();
		req.flash(
			'info',
			` Client ${client.email} record updated successfully`
		);
		res.redirect('/admin/overview/?ui=users');
	},
];

module.exports = {
	logIn,
	overview,
	editClient,
};
